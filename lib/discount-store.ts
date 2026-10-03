import type { AppliedDiscount } from "@/data/discounts";

/**
 * Kod za popust koji je kupac upisao, u localStorage — da ostane upisan između
 * korpe i poručivanja. Izložen kao spoljašnje skladište za useSyncExternalStore,
 * isto kao korpa (lib/cart-store.ts).
 */

const STORAGE_KEY = "stojkovic-popust";

let current: AppliedDiscount | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function read(): AppliedDiscount | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, percent } = JSON.parse(raw) as Record<string, unknown>;
    return typeof code === "string" && typeof percent === "number" ? { code, percent } : null;
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  current = read();
  emit();
}

export function subscribeDiscount(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getDiscountSnapshot(): AppliedDiscount | null {
  if (!loaded) {
    current = read();
    loaded = true;
  }
  return current;
}

export function getDiscountServerSnapshot(): AppliedDiscount | null {
  return null;
}

/** `null` uklanja kod. */
export function setDiscount(discount: AppliedDiscount | null) {
  current = discount;
  loaded = true;
  try {
    if (discount) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(discount));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Privatni režim ili pun localStorage: kod i dalje važi do zatvaranja kartice.
  }
  emit();
}
