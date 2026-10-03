"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { QuantityStepper } from "@/components/quantity-stepper";

export function AddToCart({ slug }: { slug: string }) {
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  return (
    <div className="flex flex-wrap gap-[12px]">
      <QuantityStepper value={qty} onChange={setQty} />
      <button
        type="button"
        onClick={() => add(slug, qty)}
        className="inline-flex min-h-[56px] grow cursor-pointer items-center justify-center bg-ink px-[32px] text-[14px] tracking-[0.14em] text-paper uppercase hover:bg-brass"
      >
        Dodaj u korpu
      </button>
    </div>
  );
}
