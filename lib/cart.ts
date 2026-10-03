import { getProduct, type Product } from "@/data/products";
import { site } from "@/data/site";

export type CartItem = { slug: string; qty: number };
export type CartLine = { product: Product; qty: number };

export const MAX_QTY = 20;

export function clampQty(qty: number): number {
  return Math.min(Math.max(Math.round(qty), 1), MAX_QTY);
}

/** Spaja stavke korpe sa proizvodima; stavke čiji proizvod više ne postoji se preskaču. */
export function toLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const product = getProduct(item.slug);
    return product ? [{ product, qty: item.qty }] : [];
  });
}

export function countPieces(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Međuzbir u RSD, ili null dok bar jedan proizvod u korpi nema upisanu cenu. */
export function getSubtotal(lines: CartLine[]): number | null {
  let subtotal = 0;
  for (const line of lines) {
    if (line.product.price === null) return null;
    subtotal += line.product.price * line.qty;
  }
  return subtotal;
}

/** Cena dostave u RSD, ili null dok nije upisana u data/site.ts. */
export function getDelivery(subtotal: number | null): number | null {
  if (site.deliveryPrice === null) return null;
  if (subtotal !== null && site.freeDeliveryFrom !== null && subtotal >= site.freeDeliveryFrom) {
    return 0;
  }
  return site.deliveryPrice;
}

export function getTotal(lines: CartLine[]): number | null {
  const subtotal = getSubtotal(lines);
  const delivery = getDelivery(subtotal);
  return subtotal === null || delivery === null ? null : subtotal + delivery;
}
