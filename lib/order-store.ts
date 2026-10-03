import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { after } from "next/server";
import { getDelivery, getSubtotal, toLines } from "@/lib/cart";
import { getProducts, STORAGE_DIR } from "@/lib/content";
import { notifyOrder } from "@/lib/order-email";
import {
  parseOrder,
  validateCustomer,
  type Order,
  type OrderResult,
  type OrderStatus,
} from "@/lib/orders";

/**
 * Porudžbine: upis pri poručivanju i čitanje za admin panel.
 * Sve su u storage/orders.json. Samo za server.
 */

const ORDERS_FILE = path.join(STORAGE_DIR, "orders.json");
const FIRST_ORDER_NUMBER = 1001;

/** Najstarija prva. */
export async function getOrders(): Promise<Order[]> {
  try {
    return JSON.parse(await readFile(ORDERS_FILE, "utf8")) as Order[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

let writeQueue: Promise<unknown> = Promise.resolve();

/** Izmene idu jedna po jedna, da dve porudžbine u istom trenutku ne pregaze jedna drugu. */
function updateOrders<T>(change: (orders: Order[]) => T): Promise<T> {
  const run = writeQueue.then(async () => {
    const orders = await getOrders();
    const result = change(orders);
    await mkdir(STORAGE_DIR, { recursive: true });
    const temp = `${ORDERS_FILE}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(orders, null, 2), "utf8");
    await rename(temp, ORDERS_FILE);
    return result;
  });
  writeQueue = run.catch(() => {});
  return run;
}

export async function setOrderStatus(number: string, status: OrderStatus) {
  await updateOrders((orders) => {
    const order = orders.find((candidate) => candidate.number === number);
    if (order) order.status = status;
  });
}

/**
 * Jedino mesto kroz koje prolazi porudžbina: proverava podatke na serveru i
 * čuva porudžbinu, koja se zatim vidi u admin panelu. Posle upisa šalje email
 * prodavcu i kupcu, prema podešavanjima u panelu (lib/order-email.ts).
 */
export async function submitOrder(input: unknown): Promise<OrderResult> {
  const { customer, items } = parseOrder(input);

  const errors = validateCustomer(customer);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // Cene se uzimaju iz proizvoda na serveru, nikad iz onoga što pošalje pregledač.
  const lines = toLines(items, await getProducts());
  if (lines.length === 0) {
    return {
      ok: false,
      errors: {},
      message: "Korpa je prazna. Dodajte sireve pa pokušajte ponovo.",
    };
  }

  const subtotal = getSubtotal(lines);
  const delivery = getDelivery(subtotal);
  const total = subtotal === null || delivery === null ? null : subtotal + delivery;

  const order = await updateOrders((orders) => {
    // Porudžbine se ne brišu (samo otkazuju), pa je redni broj uvek jedinstven.
    const saved: Order = {
      number: String(FIRST_ORDER_NUMBER + orders.length),
      receivedAt: new Date().toISOString(),
      status: "nova",
      customer,
      items: lines.map((line) => ({
        slug: line.product.slug,
        name: line.product.fullName,
        qty: line.qty,
        price: line.product.price,
      })),
      subtotal,
      delivery,
      total,
    };
    orders.push(saved);
    return saved;
  });

  // Email se šalje pošto kupac dobije odgovor, da spor mail server ne zadržava poručivanje.
  // Porudžbina je već sačuvana; ako slanje ne uspe, razlog se upisuje uz nju i vidi u panelu.
  after(async () => {
    const error = await notifyOrder(order).catch((reason) => String(reason));
    if (error) {
      console.error(`[porudžbina ${order.number}] email nije poslat: ${error}`);
      await updateOrders((orders) => {
        const target = orders.find((candidate) => candidate.number === order.number);
        if (target) target.emailError = error;
      });
    }
  });

  return { ok: true, orderNumber: order.number, total };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
});

/** Dan po našem vremenu, npr. "2026-10-03". */
function dayKey(date: Date): string {
  return dayKeyFormat.format(date);
}

function itemsValue(order: Order): number {
  return order.items.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0);
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
