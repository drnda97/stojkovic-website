import { getProduct } from "@/data/products";
import { clampQty, type CartItem } from "@/lib/cart";

/**
 * Korpa u localStorage, izložena kao spoljašnje skladište za useSyncExternalStore.
 * Jedna je za ceo sajt i prati izmene iz drugih kartica pregledača.
 */

const STORAGE_KEY = "stojkovic-korpa";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.flatMap((entry): CartItem[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { slug, qty } = entry as Record<string, unknown>;
      if (typeof slug !== "string" || typeof qty !== "number" || !Number.isFinite(qty)) return [];
      return getProduct(slug) ? [{ slug, qty: clampQty(qty) }] : [];
    });
    return valid.length > 0 ? valid : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  items = read();
  emit();
}

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): CartItem[] {
  if (!loaded) {
    items = read();
    loaded = true;
  }
  return items;
}

export function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function write(next: CartItem[]) {
  items = next.length > 0 ? next : EMPTY;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Privatni režim ili pun localStorage: korpa i dalje radi do zatvaranja kartice.
  }
  emit();
}

export function addItem(slug: string, qty: number) {
  const current = getSnapshot();
  const existing = current.find((item) => item.slug === slug);
  if (existing) {
    write(
      current.map((item) =>
        item.slug === slug ? { slug, qty: clampQty(item.qty + qty) } : item,
      ),
    );
  } else {
    write([...current, { slug, qty: clampQty(qty) }]);
  }
}

export function setItemQty(slug: string, qty: number) {
  write(
    getSnapshot().map((item) => (item.slug === slug ? { slug, qty: clampQty(qty) } : item)),
  );
}

export function removeItem(slug: string) {
  write(getSnapshot().filter((item) => item.slug !== slug));
}

export function clearItems() {
  write(EMPTY);
}
