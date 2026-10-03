"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { site } from "@/data/site";
import { formatPrice } from "@/lib/format";
import { parseLastOrder, readLastOrderRaw } from "@/lib/last-order";

const noopSubscribe = () => () => {};

export function OrderThanks() {
  const raw = useSyncExternalStore(noopSubscribe, readLastOrderRaw, () => null);
  const { orderNumber, total } = parseLastOrder(raw);

  return (
    <section className="mx-auto box-content flex max-w-[720px] flex-col items-start gap-[24px] px-[32px] pt-[120px] pb-[160px]">
      <div className="text-[12px] tracking-[0.2em] text-brass uppercase">
        Porudžbina br. {orderNumber ?? "[BROJ]"}
      </div>
      <h1 className="text-[length:clamp(44px,5.5vw,72px)] leading-[1.05]">
        Hvala, porudžbina je primljena.
      </h1>
      <p className="text-muted">
        Javićemo se telefonom u toku {site.callbackTime} da potvrdimo porudžbinu i dan slanja.
        Ništa ne plaćate sada — iznos od {formatPrice(total, "[UKUPNO]")} plaćate kuriru pri
        preuzimanju.
      </p>
      <Link
        href="/"
        className="flex min-h-[60px] items-center justify-center bg-ink px-[32px] text-[14px] tracking-[0.14em] text-paper uppercase hover:bg-brass"
      >
        Nazad na početnu
      </Link>
    </section>
  );
}
