import { MAX_QTY, type CartItem } from "@/lib/cart";

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

export type OrderStatus = "nova" | "poslata" | "otkazana";

export const orderStatusLabels: Record<OrderStatus, string> = {
  nova: "Nova",
  poslata: "Poslata",
  otkazana: "Otkazana",
};

/** Sačuvana porudžbina. Naziv i cena stavke su prepis iz trenutka poručivanja. */
export type Order = {
  number: string;
  receivedAt: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: { slug: string; name: string; qty: number; price: number | null }[];
  subtotal: number | null;
  delivery: number | null;
  total: number | null;
  /** Zašto email o porudžbini nije poslat; nema ga kada je sve prošlo. */
  emailError?: string;
};

export const emptyCustomer: OrderCustomer = {
  name: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  postalCode: "",
  note: "",
};

/** Ista pravila važe u formi (pregledač) i u submitOrder (server, lib/order-store.ts). */
export function validateCustomer(customer: OrderCustomer): OrderErrors {
  const errors: OrderErrors = {};

  if (customer.name.trim().length < 2) {
    errors.name = "Upišite ime i prezime.";
  }

  const phoneDigits = customer.phone.replace(/\D/g, "");
  if (customer.phone.trim() === "") {
    errors.phone = "Upišite broj telefona.";
  } else if (
    !/^[+\d\s/().-]+$/.test(customer.phone.trim()) ||
    phoneDigits.length < 8 ||
    phoneDigits.length > 15
  ) {
    errors.phone = "Proverite broj telefona, npr. 06x xxx xxxx.";
  }

  const email = customer.email.trim();
  if (email === "") {
    errors.email = "Upišite email adresu.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Proverite email adresu, npr. ime@primer.rs.";
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
export function parseOrder(input: unknown): OrderInput {
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
