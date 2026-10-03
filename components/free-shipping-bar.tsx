"use client";

import { useEffect, useId, useState } from "react";
import { formatPrice } from "@/lib/format";

type FreeShippingBarProps = {
  /** Vrednost proizvoda u korpi, posle popusta. */
  amount: number;
  /** Vrednost od koje je dostava besplatna. */
  freeFrom: number;
};

const WHEEL = 46;
// Obim kruga poluprečnika 8: potez debljine 16 po njemu boji isečak celog koluta.
const PIE_LENGTH = 2 * Math.PI * 8;
const MOVE = "duration-700 ease-out";

/**
 * Traka u korpi: koliko još fali do besplatne dostave. Kolut sira putuje po
 * traci i puni se kao isečak — na 20% je petina koluta, na 100% ceo kolut.
 */
export function FreeShippingBar({ amount, freeFrom }: FreeShippingBarProps) {
  const maskId = useId();
  const progress = freeFrom > 0 ? Math.min(Math.max(amount / freeFrom, 0), 1) : 1;
  const done = progress >= 1;

  // Kreće od nule pa u sledećem kadru prelazi na pravu vrednost, da se punjenje
  // vidi i kada se korpa tek otvori.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(progress));
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  const position = `calc(${WHEEL / 2}px + (100% - ${WHEEL}px) * ${shown})`;

  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[15px]" aria-live="polite">
        {done ? (
          <>
            <span className="font-medium">Dostava je besplatna.</span> Korpa je prešla{" "}
            {formatPrice(freeFrom)}.
          </>
        ) : (
          <>
            Još <span className="font-medium">{formatPrice(freeFrom - amount)}</span> do besplatne
            dostave
          </>
        )}
      </div>

      <div
        role="progressbar"
        aria-label="Do besplatne dostave"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="relative"
        style={{ height: WHEEL }}
      >
        <div className="absolute inset-x-0 top-1/2 h-[8px] -translate-y-1/2 rounded-full bg-line" />
        <div
          className={`absolute top-1/2 left-0 h-[8px] -translate-y-1/2 rounded-full bg-brass transition-[width] ${MOVE}`}
          style={{ width: position }}
        />
        <div
          className={`absolute top-0 transition-[left] ${MOVE}`}
          style={{ left: position, marginLeft: -WHEEL / 2 }}
        >
          <svg
            // Novi ključ kada se kolut popuni, da „skok" krene iz početka.
            key={done ? "pun" : "isecak"}
            width={WHEEL}
            height={WHEEL}
            viewBox="0 0 32 32"
            aria-hidden="true"
            className={done ? "animate-cheese-pop" : undefined}
          >
            <defs>
              <mask id={maskId}>
                <circle
                  cx="16"
                  cy="16"
                  r="8"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="16"
                  strokeDasharray={`${shown * PIE_LENGTH} ${PIE_LENGTH}`}
                  transform="rotate(-90 16 16)"
                  className={`transition-[stroke-dasharray] ${MOVE}`}
                />
              </mask>
            </defs>
            {/* Prazan tanjir: obris celog koluta koji tek treba da se popuni. */}
            <circle
              cx="16"
              cy="16"
              r="14.5"
              className="fill-paper stroke-line-strong"
              strokeWidth="1"
              strokeDasharray="2 2.6"
            />
            <g mask={`url(#${maskId})`}>
              <circle cx="16" cy="16" r="15" fill="#f3d27a" />
              <circle cx="16" cy="16" r="14" fill="none" stroke="#d39c3d" strokeWidth="2" />
              <g fill="#dcae4c">
                <circle cx="10.5" cy="10.5" r="2.2" />
                <circle cx="20.5" cy="9" r="1.5" />
                <circle cx="21.5" cy="19.5" r="2.6" />
                <circle cx="11" cy="21" r="1.8" />
                <circle cx="16" cy="15" r="1.2" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
