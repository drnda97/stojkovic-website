/** Ono što ekran „Hvala" prikazuje o upravo poslatoj porudžbini; živi samo u ovoj kartici. */
export type LastOrder = { orderNumber: string | null; total: number | null };

const STORAGE_KEY = "stojkovic-poslednja-porudzbina";

export function saveLastOrder(order: LastOrder) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Bez sessionStorage ekran „Hvala" prikazuje placeholdere iz dizajna.
  }
}

export function readLastOrderRaw(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseLastOrder(raw: string | null): LastOrder {
  const empty: LastOrder = { orderNumber: null, total: null };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as Partial<LastOrder>;
    return {
      orderNumber: typeof parsed.orderNumber === "string" ? parsed.orderNumber : null,
      total: typeof parsed.total === "number" ? parsed.total : null,
    };
  } catch {
    return empty;
  }
}
