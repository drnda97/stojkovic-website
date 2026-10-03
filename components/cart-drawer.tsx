"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";
import { DiscountField } from "@/components/discount-field";
import { FreeShippingBar } from "@/components/free-shipping-bar";
import { Placeholder } from "@/components/placeholder";
import { Price } from "@/components/price";
import { QuantityStepper } from "@/components/quantity-stepper";
import { hasWeight } from "@/data/products";
import { maxQty } from "@/lib/cart";
import { formatPieces, formatPrice, formatWeight } from "@/lib/format";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])';

const primaryAction =
  "flex min-h-[56px] items-center justify-center bg-ink text-[14px] tracking-[0.14em] text-paper uppercase";

export function CartDrawer() {
  const { isOpen, closeCart, lines, count, setQty, remove, pricing, discount, freeShippingFrom } =
    useCart();
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
  // Zbir proizvoda posle popusta; po njemu se meri i besplatna dostava.
  const paid = pricing.subtotal === null ? null : pricing.subtotal - pricing.discount;

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
        className={`relative flex h-full w-[min(460px,100%)] animate-drawer-in flex-col bg-paper text-[16px] ${hasItems ? "leading-[1.6]" : ""}`}
      >
        {/* Vrh i dno stoje na mestu; skroluje se samo spisak proizvoda između njih. */}
        <div className="flex shrink-0 flex-col gap-[16px] px-[16px] md:px-[32px] pt-[28px] pb-[20px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[34px]">
              Korpa
              {hasItems && (
                <span className="font-sans text-[15px] text-muted"> · {formatPieces(count)}</span>
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
          {hasItems && freeShippingFrom !== null && paid !== null && (
            <FreeShippingBar amount={paid} freeFrom={freeShippingFrom} />
          )}
        </div>

        {hasItems ? (
          <>
            <div className="flex min-h-0 grow flex-col overflow-auto px-[16px] md:px-[32px]">
              {lines.map(({ product, qty }) => (
                <div key={product.slug} className="flex gap-[16px] border-t border-line py-[20px]">
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
                      <Price product={product} />
                    </div>
                    <div className="flex items-center justify-between gap-[12px]">
                      <QuantityStepper
                        size="sm"
                        value={qty}
                        onChange={(value) => setQty(product.slug, value)}
                        max={maxQty(product)}
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

            <div className="flex shrink-0 flex-col gap-[12px] border-t border-line px-[16px] md:px-[32px] pt-[16px] pb-[20px]">
              <DiscountField collapsed />
              <div className="flex flex-col gap-[4px]">
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-[15px] text-muted">
                    <span>Popust {discount?.percent}%</span>
                    <span>−{formatPrice(pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[18px]">
                  <span>Međuzbir</span>
                  <span>{formatPrice(paid, "[IZNOS]")}</span>
                </div>
                <div className="text-[14px] text-muted">
                  {pricing.delivery === 0
                    ? "Dostava je besplatna. Plaćanje pouzećem."
                    : "Dostava se obračunava u sledećem koraku. Plaćanje pouzećem."}
                </div>
              </div>
              <div className="flex flex-col">
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
            </div>
          </>
        ) : (
          <div className="mx-[16px] md:mx-[32px] flex flex-col gap-[20px] border-t border-line pt-[24px]">
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
