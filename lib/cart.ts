import { discountAmount } from "@/data/discounts";
import { currentPrice, hasWeight, isAvailable, stockLimit, type Product } from "@/data/products";
import { site } from "@/data/site";

export type CartItem = { slug: string; qty: number };
export type CartLine = { product: Product; qty: number };

export const MAX_QTY = 20;

export function clampQty(qty: number): number {
  return Math.min(Math.max(Math.round(qty), 1), MAX_QTY);
}

/** Najveća količina jednog proizvoda u korpi: opšte ograničenje ili ono što je na stanju. */
export function maxQty(product: Product): number {
  return Math.min(stockLimit(product) ?? MAX_QTY, MAX_QTY);
}

/**
 * Spaja stavke korpe sa proizvodima. Stavke čiji proizvod više ne postoji ili
 * ga nema na stanju se preskaču, a količina se svodi na ono što je na stanju.
 */
export function toLines(items: CartItem[], products: Product[]): CartLine[] {
  return items.flatMap((item) => {
    const product = products.find((candidate) => candidate.slug === item.slug);
    if (!product || !isAvailable(product)) return [];
    return [{ product, qty: Math.min(item.qty, maxQty(product)) }];
  });
}

/**
 * Za server, pre upisa porudžbine: poruka kupcu ako nečega iz korpe nema
 * dovoljno, ili null kada je sve na stanju.
 */
export function findStockProblem(items: CartItem[], products: Product[]): string | null {
  for (const item of items) {
    const product = products.find((candidate) => candidate.slug === item.slug);
    if (!product) continue;
    if (!isAvailable(product)) {
      return `„${product.fullName}" trenutno nije na stanju. Uklonite ga iz korpe pa potvrdite ponovo.`;
    }
    const limit = stockLimit(product);
    if (limit !== null && item.qty > limit) {
      return `Na stanju je još samo ${limit} kom. proizvoda „${product.fullName}". Smanjite količinu pa potvrdite ponovo.`;
    }
  }
  return null;
}

export function countPieces(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Međuzbir u RSD, ili null dok bar jedan proizvod u korpi nema upisanu cenu. */
export function getSubtotal(lines: CartLine[]): number | null {
  let subtotal = 0;
  for (const line of lines) {
    const price = currentPrice(line.product);
    if (price === null) return null;
    subtotal += price * line.qty;
  }
  return subtotal;
}

/** Ukupna težina u gramima; proizvodi bez gramaže (paketi) se ne računaju. */
export function getWeight(lines: CartLine[]): number {
  return lines.reduce(
    (sum, line) => sum + (hasWeight(line.product) ? (line.product.weight ?? 0) * line.qty : 0),
    0,
  );
}

export type Pricing = {
  /** Zbir proizvoda, ili null dok bar jedan nema upisanu cenu. */
  subtotal: number | null;
  /** Popust u RSD; 0 kada kod nije upisan. */
  discount: number;
  /** Cena dostave, ili null dok nije upisana u data/site.ts. */
  delivery: number | null;
  total: number | null;
};

type PricingOptions = {
  /** Procenat popusta iz koda koji je kupac upisao. */
  discountPercent?: number;
  /** Vrednost od koje je dostava besplatna; null kada je besplatna dostava isključena. */
  freeShippingFrom: number | null;
};

/**
 * Obračun porudžbine. Isti je u korpi (pregledač) i pri upisu porudžbine
 * (server): popust se oduzima od zbira proizvoda, a prag za besplatnu dostavu
 * gleda iznos posle popusta.
 */
export function getPricing(lines: CartLine[], options: PricingOptions): Pricing {
  const subtotal = getSubtotal(lines);
  const discount =
    subtotal !== null && options.discountPercent
      ? discountAmount(subtotal, options.discountPercent)
      : 0;
  const paid = subtotal === null ? null : subtotal - discount;

  let delivery = site.deliveryPrice;
  if (paid !== null && options.freeShippingFrom !== null && paid >= options.freeShippingFrom) {
    delivery = 0;
  }

  return {
    subtotal,
    discount,
    delivery,
    total: paid === null || delivery === null ? null : paid + delivery,
  };
}
