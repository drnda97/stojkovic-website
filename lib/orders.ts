import { getDelivery, getSubtotal, MAX_QTY, toLines, type CartItem } from "@/lib/cart";

export type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  postalCode: string;
  note: string;
};

export type OrderInput = {
  customer: OrderCustomer;
  items: CartItem[];
};

export type CustomerField = keyof OrderCustomer;
export type OrderErrors = Partial<Record<CustomerField, string>>;

export type OrderResult =
  | { ok: true; orderNumber: string | null; total: number | null }
  | { ok: false; errors: OrderErrors; message?: string };

export const emptyCustomer: OrderCustomer = {
  name: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  postalCode: "",
  note: "",
};

/** Ista pravila važe u formi (pregledač) i u submitOrder (server). */
export function validateCustomer(customer: OrderCustomer): OrderErrors {
  const errors: OrderErrors = {};

  if (customer.name.trim().length < 2) {
    errors.name = "Upišite ime i prezime.";
  }

  const phoneDigits = customer.phone.replace(/\D/g, "");
  if (customer.phone.trim() === "") {
    errors.phone = "Upišite broj telefona.";
  } else if (!/^[+\d\s/().-]+$/.test(customer.phone.trim()) || phoneDigits.length < 8 || phoneDigits.length > 15) {
    errors.phone = "Proverite broj telefona, npr. 06x xxx xxxx.";
  }

  const email = customer.email.trim();
  if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Proverite email adresu ili ostavite polje prazno.";
  }

  if (customer.street.trim().length < 3) {
    errors.street = "Upišite ulicu i broj.";
  }

  if (customer.city.trim().length < 2) {
    errors.city = "Upišite mesto.";
  }

  if (customer.postalCode.trim() === "") {
    errors.postalCode = "Upišite poštanski broj.";
  } else if (!/^\d{5}$/.test(customer.postalCode.trim())) {
    errors.postalCode = "Poštanski broj ima pet cifara.";
  }

  if (customer.note.length > 500) {
    errors.note = "Napomena može imati najviše 500 znakova.";
  }

  return errors;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Podaci stižu iz pregledača, pa im se ne veruje: sve se čita i proverava iznova. */
function parseOrder(input: unknown): OrderInput {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const rawCustomer = (
    typeof raw.customer === "object" && raw.customer !== null ? raw.customer : {}
  ) as Record<string, unknown>;

  const customer: OrderCustomer = {
    name: asText(rawCustomer.name).trim(),
    phone: asText(rawCustomer.phone).trim(),
    email: asText(rawCustomer.email).trim(),
    street: asText(rawCustomer.street).trim(),
    city: asText(rawCustomer.city).trim(),
    postalCode: asText(rawCustomer.postalCode).trim(),
    note: asText(rawCustomer.note).trim(),
  };

  const items = (Array.isArray(raw.items) ? raw.items : []).flatMap((entry): CartItem[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const { slug, qty } = entry as Record<string, unknown>;
    if (typeof slug !== "string" || typeof qty !== "number") return [];
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return [];
    return [{ slug, qty }];
  });

  return { customer, items };
}

/**
 * Jedino mesto kroz koje prolazi porudžbina.
 *
 * Za sada: proverava podatke na serveru i upisuje porudžbinu u log servera.
 * Nije odlučeno gde vlasniku stižu porudžbine (email, SMS ili admin panel),
 * pa ovde namerno nema baze, servisa za email ni autentifikacije.
 */
export async function submitOrder(input: unknown): Promise<OrderResult> {
  const { customer, items } = parseOrder(input);

  const errors = validateCustomer(customer);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // Cene se uzimaju iz data/products.ts, nikad iz onoga što pošalje pregledač.
  const lines = toLines(items);
  if (lines.length === 0) {
    return { ok: false, errors: {}, message: "Korpa je prazna. Dodajte sireve pa pokušajte ponovo." };
  }

  const subtotal = getSubtotal(lines);
  const delivery = getDelivery(subtotal);
  const total = subtotal === null || delivery === null ? null : subtotal + delivery;

  const order = {
    receivedAt: new Date().toISOString(),
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
    payment: "pouzećem",
  };

  // OVDE SE KASNIJE PRIKLJUČUJE PRAVO SLANJE PORUDŽBINE
  // (email vlasniku, SMS ili upis u bazu za admin panel). Kada se to dogovori,
  // zameni console.info ispod pozivom tog servisa i vrati pravi broj porudžbine
  // u `orderNumber` — ekran „Hvala" ga tada prikazuje umesto „[BROJ]".
  // Dok se to ne uradi, porudžbina postoji SAMO u logu servera.
  console.info("[porudžbina]", JSON.stringify(order, null, 2));

  return { ok: true, orderNumber: null, total };
}
