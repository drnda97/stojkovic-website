"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { checkDiscountCode } from "@/app/(checkout)/porudzbina/actions";
import { useCart } from "@/components/cart-provider";
import { normalizeCode } from "@/data/discounts";

/**
 * Polje za kod za popust, u korpi i u pregledu porudžbine. Kod proverava
 * server; kada je prihvaćen, ostaje upisan dok ga kupac ne ukloni ili ne poruči.
 */
type DiscountFieldProps = {
  /** U korpi polje stoji sklopljeno iza linka, da dno korpe ostane nisko. */
  collapsed?: boolean;
};

export function DiscountField({ collapsed = false }: DiscountFieldProps) {
  const { discount, setDiscount } = useCart();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(!collapsed);
  const [pending, startTransition] = useTransition();
  const id = useId();

  if (discount) {
    return (
      <div className="flex items-center justify-between gap-[12px] text-[15px]">
        <span>
          Kod <span className="font-medium tracking-[0.06em]">{discount.code}</span> · popust{" "}
          {discount.percent}%
        </span>
        <button
          type="button"
          onClick={() => setDiscount(null)}
          className="min-h-[44px] cursor-pointer text-[14px] text-muted underline"
        >
          Ukloni kod
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] cursor-pointer self-start text-[15px] text-ink underline"
      >
        Imate kod za popust?
      </button>
    );
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    const code = normalizeCode(value);
    if (!code) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await checkDiscountCode(code);
        if (result.ok) {
          setDiscount(result.discount);
          setValue("");
        } else {
          setError(result.message);
        }
      } catch {
        setError("Kod nije proveren. Proverite internet vezu i pokušajte ponovo.");
      }
    });
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-[6px]">
      <label htmlFor={id} className="text-[14px] text-muted">
        Kod za popust
      </label>
      <div className="flex gap-[8px]">
        <input
          id={id}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          autoComplete="off"
          autoFocus={collapsed}
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-greska` : undefined}
          className="min-h-[48px] w-full min-w-0 rounded-none border border-line-strong bg-field px-[14px] text-[16px] tracking-[0.06em] text-ink uppercase focus:outline-2 focus:outline-offset-1 focus:outline-brass"
        />
        <button
          type="submit"
          disabled={pending || value.trim() === ""}
          aria-busy={pending}
          className="min-h-[48px] shrink-0 cursor-pointer border border-ink px-[18px] text-[13px] tracking-[0.14em] text-ink uppercase hover:bg-ink hover:text-paper disabled:cursor-default disabled:border-line-strong disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
        >
          Primeni
        </button>
      </div>
      {error && (
        <p id={`${id}-greska`} role="alert" className="text-[14px] text-ink">
          {error}
        </p>
      )}
    </form>
  );
}
