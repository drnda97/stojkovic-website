"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { QuantityStepper } from "@/components/quantity-stepper";

type AddToCartProps = {
  slug: string;
  /** false: proizvoda nema na stanju, pa ne može u korpu. */
  available: boolean;
  /** Najveća količina za jednu porudžbinu (lib/cart.ts → maxQty). */
  max: number;
};

export function AddToCart({ slug, available, max }: AddToCartProps) {
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  if (!available) {
    return (
      <div className="flex min-h-[56px] items-center justify-center border border-line-strong px-[32px] text-[14px] tracking-[0.14em] text-muted uppercase">
        Trenutno nema na stanju
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-[12px]">
      <QuantityStepper value={Math.min(qty, max)} onChange={setQty} max={max} />
      <button
        type="button"
        onClick={() => add(slug, Math.min(qty, max))}
        className="inline-flex min-h-[56px] grow cursor-pointer items-center justify-center bg-ink px-[32px] text-[14px] tracking-[0.14em] text-paper uppercase hover:bg-brass"
      >
        Dodaj u korpu
      </button>
    </div>
  );
}
