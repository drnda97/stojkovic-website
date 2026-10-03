import { randomInt } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { after } from "next/server";
import { normalizeCode, pickDiscount, type AppliedDiscount } from "@/data/discounts";
import { findStockProblem, getPricing, getWeight, toLines } from "@/lib/cart";
import { getDiscounts, getFreeShippingFrom, getProducts, withContentLock } from "@/lib/content";
import { currentPrice } from "@/data/products";
import { getDb } from "@/lib/db";
import { notifyOrder } from "@/lib/order-email";
import {
  parseOrder,
  validateCustomer,
  type Order,
  type OrderResult,
  type OrderStatus,
} from "@/lib/orders";

/**
 * Porudžbine i kodovi za popust: upis pri poručivanju i čitanje za admin panel.
 * U bazi su u tabelama `orders`, `order_items` i `discount_codes` (lib/db.ts).
 * Samo za server.
 */

/** Najstarija prva. */
export async function getOrders(): Promise<Order[]> {
  const db = await getDb();
  const [orders] = await db.query<RowDataPacket[]>("SELECT * FROM orders ORDER BY number");
  const [items] = await db.query<RowDataPacket[]>(
    "SELECT * FROM order_items ORDER BY order_number, position",
  );

  return orders.map((row) => ({
    number: String(row.number),
    receivedAt: (row.received_at as Date).toISOString(),
    status: row.status,
    customer: {
      name: row.customer_name,
      phone: row.phone,
      email: row.email,
      street: row.street,
      city: row.city,
      postalCode: row.postal_code,
      note: row.note,
    },
    items: items
      .filter((item) => item.order_number === row.number)
      .map((item) => ({ slug: item.slug, name: item.name, qty: item.qty, price: item.price })),
    subtotal: row.subtotal,
    delivery: row.delivery,
    total: row.total,
    ...(row.discount_code === null
      ? {}
      : {
          discount: {
            code: row.discount_code,
            percent: row.discount_percent,
            amount: row.discount_amount,
          },
        }),
    ...(row.issued_code === null
      ? {}
      : {
          issuedCode: {
            code: row.issued_code,
            percent: row.issued_percent,
            title: row.issued_title ?? "",
          },
        }),
    ...(row.email_error === null ? {} : { emailError: row.email_error }),
  }));
}

/**
 * Menja status porudžbine. Otkazivanje vraća komade na stanje, a vraćanje
 * otkazane porudžbine ih ponovo skida — samo kod proizvoda kojima se vodi broj.
 */
export async function setOrderStatus(number: string, status: OrderStatus) {
  await withContentLock(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT status FROM orders WHERE number = ?",
      [number],
    );
    if (rows.length === 0 || rows[0].status === status) return;

    const wasCancelled = rows[0].status === "otkazana";
    const isCancelled = status === "otkazana";
    if (wasCancelled !== isCancelled) {
      const [items] = await connection.query<RowDataPacket[]>(
        "SELECT slug, qty FROM order_items WHERE order_number = ?",
        [number],
      );
      for (const item of items) {
        await connection.query(
          isCancelled
            ? "UPDATE products SET stock_qty = stock_qty + ? WHERE slug = ? AND stock_qty IS NOT NULL"
            : "UPDATE products SET stock_qty = GREATEST(stock_qty - ?, 0) WHERE slug = ? AND stock_qty IS NOT NULL",
          [item.qty, item.slug],
        );
      }
    }
    await connection.query("UPDATE orders SET status = ? WHERE number = ?", [status, number]);
  });
}

/** Koliko je kodova poslato i iskorišćeno po pravilu popusta, za admin panel. */
export async function getCodeCounts(): Promise<Record<string, { sent: number; used: number }>> {
  const [rows] = await (
    await getDb()
  ).query<RowDataPacket[]>(
    "SELECT discount_id, COUNT(*) AS sent, COUNT(used_order) AS used FROM discount_codes GROUP BY discount_id",
  );
  return Object.fromEntries(
    rows.map((row) => [row.discount_id, { sent: Number(row.sent), used: Number(row.used) }]),
  );
}

const CODE_PROBLEM = "Kod nije ispravan ili je već iskorišćen.";

/** Neiskorišćena slanja datog koda, najstarije prvo. */
async function findUnusedCodes(input: string): Promise<RowDataPacket[]> {
  const code = normalizeCode(input);
  if (code === "" || code.length > 32) return [];
  const [rows] = await (
    await getDb()
  ).query<RowDataPacket[]>(
    "SELECT id, code, percent, email, phone FROM discount_codes WHERE code = ? AND used_order IS NULL ORDER BY id",
    [code],
  );
  return rows;
}

export type CodeCheck = { ok: true; discount: AppliedDiscount } | { ok: false; message: string };

/**
 * Provera koda u korpi, gde se još ne zna ko je kupac: prolazi kod koji je
 * nekome poslat i još nije iskorišćen. Da li je poslat baš ovom kupcu
 * proverava se pri poručivanju (findCodeFor).
 */
export async function checkCode(input: unknown): Promise<CodeCheck> {
  const rows = typeof input === "string" ? await findUnusedCodes(input) : [];
  return rows.length > 0
    ? { ok: true, discount: { code: rows[0].code, percent: rows[0].percent } }
    : { ok: false, message: CODE_PROBLEM };
}

/** Kod važi samo za kupca kome je poslat: isti email ili isti broj telefona. */
async function findCodeFor(
  input: string,
  customer: { email: string; phone: string },
): Promise<(AppliedDiscount & { id: number }) | null> {
  const row = (await findUnusedCodes(input)).find(
    (candidate) =>
      candidate.email.toLowerCase() === customer.email.toLowerCase() ||
      (candidate.phone !== "" && phoneDigits(candidate.phone) === phoneDigits(customer.phone)),
  );
  return row ? { id: row.id, code: row.code, percent: row.percent } : null;
}

// Bez slova i cifara koje se lako pomešaju (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "SIR-";
  for (let index = 0; index < 6; index++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** Broj telefona sveden na cifre, bez pozivnog i početne nule, da se isti broj prepozna u svakom zapisu. */
function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^(381|0)/, "");
}

class CodeAlreadyUsed extends Error {}
class OutOfStock extends Error {}

/**
 * Upisuje porudžbinu u jednoj transakciji: stavke, skidanje sa stanja,
 * potrošnju upisanog koda i novi kod za sledeću kupovinu. Broj porudžbine dodeljuje baza.
 */
async function insertOrder(
  order: Omit<Order, "number" | "issuedCode">,
  weight: number,
  /** Red u discount_codes koji ova porudžbina troši; null kada kod nije upisan. */
  usedCodeId: number | null,
): Promise<Order> {
  const discounts = await getDiscounts();
  return withContentLock(async (connection) => {
    const { customer } = order;

    // Prva porudžbina: isti kupac (po emailu ili telefonu) do sada nije poručivao.
    // Otkazane porudžbine se ne računaju.
    const [earlier] = await connection.query<RowDataPacket[]>(
      "SELECT email, phone FROM orders WHERE status <> 'otkazana'",
    );
    const isFirstOrder = !earlier.some(
      (row) =>
        row.email.toLowerCase() === customer.email.toLowerCase() ||
        phoneDigits(row.phone) === phoneDigits(customer.phone),
    );

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO orders (received_at, status, customer_name, phone, email, street, city,
        postal_code, note, subtotal, delivery, total, discount_code, discount_percent,
        discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        new Date(order.receivedAt),
        order.status,
        customer.name,
        customer.phone,
        customer.email,
        customer.street,
        customer.city,
        customer.postalCode,
        customer.note,
        order.subtotal,
        order.delivery,
        order.total,
        order.discount?.code ?? null,
        order.discount?.percent ?? null,
        order.discount?.amount ?? 0,
      ],
    );
    const number = result.insertId;
    await connection.query(
      "INSERT INTO order_items (order_number, position, slug, name, qty, price) VALUES ?",
      [
        order.items.map((item, index) => [
          number,
          index,
          item.slug,
          item.name,
          item.qty,
          item.price,
        ]),
      ],
    );

    // Skidanje sa stanja, samo kod proizvoda kojima se vodi broj komada. Uslov u upitu čuva
    // od toga da dve porudžbine u istom trenutku prodaju isti poslednji komad.
    for (const item of order.items) {
      const [tracked] = await connection.query<RowDataPacket[]>(
        "SELECT stock_qty FROM products WHERE slug = ?",
        [item.slug],
      );
      if (tracked.length === 0 || tracked[0].stock_qty === null) continue;
      const [taken] = await connection.query<ResultSetHeader>(
        "UPDATE products SET stock_qty = stock_qty - ? WHERE slug = ? AND stock_qty >= ?",
        [item.qty, item.slug, item.qty],
      );
      if (taken.affectedRows === 0) throw new OutOfStock();
    }

    if (usedCodeId !== null) {
      // Uslov "used_order IS NULL" čuva od toga da dve porudžbine u istom trenutku potroše isti kod.
      const [used] = await connection.query<ResultSetHeader>(
        "UPDATE discount_codes SET used_order = ?, used_at = ? WHERE id = ? AND used_order IS NULL",
        [number, new Date(), usedCodeId],
      );
      if (used.affectedRows === 0) throw new CodeAlreadyUsed();
    }

    // Kod za sledeću kupovinu: najjači aktivan popust čiji uslov ova porudžbina ispunjava.
    const rule = pickDiscount(discounts, {
      isFirstOrder,
      amount: (order.subtotal ?? 0) - (order.discount?.amount ?? 0),
      weight,
    });
    let issuedCode: Order["issuedCode"];
    if (rule) {
      // Kod koji je vlasnik upisao uz popust; ako ga nema, nasumičan kod samo za ovog kupca.
      issuedCode = { code: rule.code || generateCode(), percent: rule.percent, title: rule.name };
      await connection.query(
        `INSERT INTO discount_codes (code, discount_id, discount_name, percent, issued_order, email,
          phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          issuedCode.code,
          rule.id,
          rule.name,
          rule.percent,
          number,
          customer.email,
          customer.phone,
          new Date(),
        ],
      );
      await connection.query(
        "UPDATE orders SET issued_code = ?, issued_percent = ?, issued_title = ? WHERE number = ?",
        [issuedCode.code, issuedCode.percent, issuedCode.title, number],
      );
    }

    return { ...order, number: String(number), ...(issuedCode ? { issuedCode } : {}) };
  });
}

/**
 * Jedino mesto kroz koje prolazi porudžbina: proverava podatke na serveru i
 * čuva porudžbinu, koja se zatim vidi u admin panelu. Posle upisa šalje email
 * prodavcu i kupcu, prema podešavanjima u panelu (lib/order-email.ts).
 */
export async function submitOrder(input: unknown): Promise<OrderResult> {
  const { customer, items, discountCode } = parseOrder(input);

  const errors = validateCustomer(customer);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // Cene i stanje se uzimaju iz proizvoda na serveru, nikad iz onoga što pošalje pregledač.
  const products = await getProducts();
  const stockProblem = findStockProblem(items, products);
  if (stockProblem) return { ok: false, errors: {}, message: stockProblem };
  const lines = toLines(items, products);
  if (lines.length === 0) {
    return {
      ok: false,
      errors: {},
      message: "Korpa je prazna. Dodajte sireve pa pokušajte ponovo.",
    };
  }

  const codeProblem: OrderResult = {
    ok: false,
    errors: {},
    message:
      "Kod za popust ne važi za ovu porudžbinu: nije poslat na upisani email ili telefon, ili je već iskorišćen. Uklonite kod u pregledu porudžbine pa potvrdite ponovo.",
  };
  const applied = discountCode ? await findCodeFor(discountCode, customer) : null;
  if (discountCode && !applied) return codeProblem;

  const pricing = getPricing(lines, {
    discountPercent: applied?.percent,
    freeShippingFrom: await getFreeShippingFrom(),
  });

  let order: Order;
  try {
    order = await insertOrder(
      {
        receivedAt: new Date().toISOString(),
        status: "nova",
        customer,
        items: lines.map((line) => ({
          slug: line.product.slug,
          name: line.product.fullName,
          qty: line.qty,
          // Cena u trenutku poručivanja: akcijska ako akcija važi.
          price: currentPrice(line.product),
        })),
        subtotal: pricing.subtotal,
        delivery: pricing.delivery,
        total: pricing.total,
        ...(applied && pricing.discount > 0
          ? { discount: { code: applied.code, percent: applied.percent, amount: pricing.discount } }
          : {}),
      },
      getWeight(lines),
      applied && pricing.discount > 0 ? applied.id : null,
    );
  } catch (error) {
    if (error instanceof CodeAlreadyUsed) return codeProblem;
    if (error instanceof OutOfStock) {
      return {
        ok: false,
        errors: {},
        message:
          "Neko je upravo poručio poslednje komade nečega iz vaše korpe. Osvežite stranicu, proverite korpu pa potvrdite ponovo.",
      };
    }
    throw error;
  }

  // Email se šalje pošto kupac dobije odgovor, da spor mail server ne zadržava poručivanje.
  // Porudžbina je već sačuvana; ako slanje ne uspe, razlog se upisuje uz nju i vidi u panelu.
  after(async () => {
    const error = await notifyOrder(order).catch((reason) => String(reason));
    if (error) {
      console.error(`[porudžbina ${order.number}] email nije poslat: ${error}`);
      await (
        await getDb()
      ).query("UPDATE orders SET email_error = ? WHERE number = ?", [error, order.number]);
    }
  });

  return { ok: true, orderNumber: order.number, total: order.total };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
});

/** Dan po našem vremenu, npr. "2026-10-03". */
function dayKey(date: Date): string {
  return dayKeyFormat.format(date);
}

/** Vrednost proizvoda u porudžbini, posle popusta i bez dostave. */
function itemsValue(order: Order): number {
  const items = order.items.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0);
  return items - (order.discount?.amount ?? 0);
}

function pieces(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

function summarize(orders: Order[]) {
  const sales = orders.reduce((sum, order) => sum + itemsValue(order), 0);
  return {
    orders: orders.length,
    /** Vrednost prodatih proizvoda u RSD, bez dostave. */
    sales,
    pieces: orders.reduce((sum, order) => sum + pieces(order), 0),
    average: orders.length > 0 ? Math.round(sales / orders.length) : null,
  };
}

/** Brojke za početnu stranu panela. Otkazane porudžbine se ne računaju u prodaju. */
export function getSalesStats(orders: Order[], now = new Date()) {
  const valid = orders.filter((order) => order.status !== "otkazana");
  const since = (days: number) => now.getTime() - days * DAY_MS;
  const between = (from: number, to: number) =>
    valid.filter((order) => {
      const time = new Date(order.receivedAt).getTime();
      return time >= from && time < to;
    });

  // Poslednjih 30 dana, dan po dan, uključujući dane bez porudžbina.
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now.getTime() - (29 - index) * DAY_MS);
    return { key: dayKey(date), date, orders: 0, sales: 0 };
  });
  const byDay = new Map(days.map((day) => [day.key, day]));
  for (const order of valid) {
    const day = byDay.get(dayKey(new Date(order.receivedAt)));
    if (day) {
      day.orders += 1;
      day.sales += itemsValue(order);
    }
  }

  const products = new Map<
    string,
    { slug: string; name: string; qty: number; sales: number; orders: number }
  >();
  const cities = new Map<string, { name: string; orders: number }>();
  const customers = new Map<string, number>();
  for (const order of valid) {
    for (const item of order.items) {
      const entry = products.get(item.slug) ?? {
        slug: item.slug,
        name: item.name,
        qty: 0,
        sales: 0,
        orders: 0,
      };
      entry.name = item.name;
      entry.qty += item.qty;
      entry.sales += (item.price ?? 0) * item.qty;
      entry.orders += 1;
      products.set(item.slug, entry);
    }
    const cityKey = order.customer.city.trim().toLocaleLowerCase("sr");
    const city = cities.get(cityKey) ?? {
      name: order.customer.city.trim(),
      orders: 0,
    };
    city.orders += 1;
    cities.set(cityKey, city);
    // Kupac se prepoznaje po broju telefona, bez razmaka i znakova.
    const phone = order.customer.phone.replace(/\D/g, "").replace(/^(381|0)/, "");
    customers.set(phone, (customers.get(phone) ?? 0) + 1);
  }

  return {
    all: summarize(valid),
    last30: summarize(between(since(30), Infinity)),
    previous30: summarize(between(since(60), since(30))),
    last7: summarize(between(since(7), Infinity)),
    days,
    topProducts: [...products.values()].sort((a, b) => b.qty - a.qty || b.sales - a.sales),
    topCities: [...cities.values()].sort((a, b) => b.orders - a.orders),
    customers: customers.size,
    returningCustomers: [...customers.values()].filter((count) => count > 1).length,
    /** Porudžbine u kojima bar jedan proizvod nije imao upisanu cenu — fale u prodaji. */
    unpriced: valid.filter((order) => order.items.some((item) => item.price === null)).length,
    waiting: orders.filter((order) => order.status === "nova").length,
    cancelled: orders.length - valid.length,
  };
}
