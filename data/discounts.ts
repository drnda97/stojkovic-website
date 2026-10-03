/**
 * Popusti koji se šalju kupcima posle porudžbine, za sledeću kupovinu.
 *
 * Vlasnik u admin panelu pravi pravila: koliki je popust i kada se šalje.
 * Posle svake porudžbine bira se najjači aktivan popust čiji je uslov
 * ispunjen, i kupac u emailu dobija kod. Kod važi za jednu kupovinu i samo
 * za kupca kome je poslat (prepoznaje se po emailu ili telefonu).
 */

/** Kada se popust šalje: uz prvu porudžbinu, ili kada vrednost odnosno težina pređe prag. */
export type DiscountTrigger = "first" | "amount" | "weight";

export type Discount = {
  id: string;
  /** Naslov popusta; kupac ga vidi u emailu uz kod. */
  name: string;
  /** Kod koji je vlasnik upisao, npr. "SIR10". Prazno: svaki kupac dobija svoj, nasumičan kod. */
  code: string;
  /** Popust u procentima, 1–100. */
  percent: number;
  /** Nacrt se ne šalje. */
  status: "draft" | "active";
  trigger: DiscountTrigger;
  /** Prag: RSD za "amount", grami za "weight"; za "first" se ne koristi. */
  threshold: number;
};

export const triggerLabels: Record<DiscountTrigger, string> = {
  first: "Prva porudžbina kupca",
  amount: "Vrednost porudžbine od (RSD)",
  weight: "Težina porudžbine od (g)",
};

/** Kod koji je kupac upisao u korpi i koji je server potvrdio. */
export type AppliedDiscount = { code: string; percent: number };

export type OrderFacts = {
  /** Kupac (po emailu ili telefonu) do sada nije poručivao. */
  isFirstOrder: boolean;
  /** Vrednost proizvoda u RSD, posle popusta i bez dostave. */
  amount: number;
  /** Ukupna težina u gramima; proizvodi bez gramaže se ne računaju. */
  weight: number;
};

/** Najjači aktivan popust čiji je uslov ispunjen; kod istog procenta, onaj koji je prvi u spisku. */
export function pickDiscount(discounts: Discount[], facts: OrderFacts): Discount | null {
  let best: Discount | null = null;
  for (const discount of discounts) {
    if (discount.status !== "active") continue;
    const met =
      discount.trigger === "first"
        ? facts.isFirstOrder
        : discount.trigger === "amount"
          ? facts.amount >= discount.threshold
          : facts.weight >= discount.threshold;
    if (met && (best === null || discount.percent > best.percent)) best = discount;
  }
  return best;
}

/** Iznos popusta u RSD, zaokružen na ceo dinar. */
export function discountAmount(subtotal: number, percent: number): number {
  return Math.round((subtotal * percent) / 100);
}

/** Kod koji vlasnik upisuje: 3–32 znaka, slova bez kvačica, cifre i crtica. */
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9-]{3,32}$/.test(code);
}

/** Kod se piše velikim slovima, bez razmaka — tako se i poredi. */
export function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}
