"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";
import { Placeholder } from "@/components/placeholder";
import { QuantityStepper } from "@/components/quantity-stepper";
import { hasWeight } from "@/data/products";
import { getSubtotal } from "@/lib/cart";
import { formatPieces, formatPrice, formatWeight } from "@/lib/format";

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])';

const primaryAction =
  "flex min-h-[56px] items-center justify-center bg-ink text-[14px] tracking-[0.14em] text-paper uppercase";

export function CartDrawer() {
  const { isOpen, closeCart, lines, count, setQty, remove } = useCart();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Dok je drawer otvoren: Esc zatvara, Tab ostaje unutra, stranica iza se ne skroluje.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!panelRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused?.focus();
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const hasItems = lines.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Zatvori korpu"
        tabIndex={-1}
        onClick={closeCart}
        className="absolute inset-0 animate-fade-in cursor-pointer bg-[rgba(30,27,22,0.45)]"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Korpa"
        className={`relative flex h-full w-[min(460px,100%)] animate-drawer-in flex-col gap-[24px] overflow-auto bg-paper px-[32px] py-[28px] text-[16px] ${hasItems ? "leading-[1.6]" : ""}`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[34px]">
            Korpa
            {hasItems && (
              <span className="font-sans text-[15px] text-muted">
                {" "}
                · {formatPieces(count)}
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Zatvori korpu"
            onClick={closeCart}
            className="h-[44px] w-[44px] cursor-pointer text-[26px] text-ink"
          >
            ×
          </button>
        </div>

        {hasItems ? (
          <>
            <div className="flex flex-col">
              {lines.map(({ product, qty }, index) => (
                <div
                  key={product.slug}
                  className={`flex gap-[16px] border-t border-line py-[20px] ${index === lines.length - 1 ? "border-b" : ""}`}
                >
                  <Placeholder
                    label="Foto"
                    variant="mini"
                    src={product.image}
                    sizes="88px"
                    className="h-[110px] w-[88px] shrink-0"
                  />
                  <div className="flex grow flex-col gap-[8px]">
                    <div className="font-serif text-[22px] leading-[1.2] font-medium">
                      {product.fullName}
                    </div>
                    <div className="text-[14px] text-muted">
                      {hasWeight(product) && `${formatWeight(product.weight)} · `}
                      {formatPrice(product.price)}
                    </div>
                    <div className="flex items-center justify-between gap-[12px]">
                      <QuantityStepper
                        size="sm"
                        value={qty}
                        onChange={(value) => setQty(product.slug, value)}
                      />
                      <button
                        type="button"
                        onClick={() => remove(product.slug)}
                        className="min-h-[44px] cursor-pointer text-[14px] text-muted underline"
                      >
                        Ukloni
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-[6px]">
              <div className="flex justify-between text-[18px]">
                <span>Međuzbir</span>
                <span>{formatPrice(getSubtotal(lines), "[IZNOS]")}</span>
              </div>
              <div className="text-[14px] text-muted">
                Dostava se obračunava u sledećem koraku. Plaćanje pouzećem.
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <Link href="/porudzbina" onClick={closeCart} className={primaryAction}>
                Nastavi na porudžbinu
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="min-h-[48px] cursor-pointer text-[15px] text-ink underline"
              >
                Nastavi kupovinu
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-[20px] border-t border-line pt-[24px]">
            <p className="text-muted">Korpa je prazna.</p>
            <Link href="/sirevi" onClick={closeCart} className={primaryAction}>
              Pogledaj sireve
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
