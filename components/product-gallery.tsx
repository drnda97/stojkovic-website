"use client";

import { useRef, useState } from "react";
import { Placeholder } from "@/components/placeholder";

export type GalleryImage = { src?: string; label: string };

const arrow =
  "absolute top-1/2 flex size-[44px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-paper/85 text-ink shadow-[0_1px_6px_rgba(30,27,22,0.18)] transition-colors hover:bg-paper hover:text-brass";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Galerija na stranici proizvoda: slajder sa strelicama. Na telefonu se slike
 * menjaju i prevlačenjem prsta, a ispod su samo tačkice; na većem ekranu su
 * ispod sličice, i klik na sličicu dovodi tu sliku.
 */
export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const many = images.length > 1;

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    // Sa poslednje slike strelica vodi na prvu, i obrnuto.
    const target = (index + images.length) % images.length;
    track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="relative">
        {/* Traka koja se skroluje vodoravno i „hvata" na svaku sliku: prevlačenje prstom
            radi samo od sebe, a strelice i sličice je samo pomeraju na traženo mesto. */}
        <div
          ref={trackRef}
          onScroll={(event) => {
            const track = event.currentTarget;
            const index = Math.round(track.scrollLeft / track.clientWidth);
            if (index !== active) setActive(index);
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              role="group"
              aria-label={`Slika ${index + 1} od ${images.length}`}
              className="w-full shrink-0 snap-center"
            >
              <Placeholder label={image.label} src={image.src} className="aspect-square" />
            </div>
          ))}
        </div>

        {many && (
          <>
            <button
              type="button"
              aria-label="Prethodna slika"
              onClick={() => goTo(active - 1)}
              className={`${arrow} left-[10px]`}
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              aria-label="Sledeća slika"
              onClick={() => goTo(active + 1)}
              className={`${arrow} right-[10px]`}
            >
              <Chevron direction="right" />
            </button>
          </>
        )}
      </div>

      {many && (
        <>
          {/* Telefon: tačkice umesto sličica. */}
          <div className="flex items-center justify-center gap-[8px] md:hidden" aria-hidden="true">
            {images.map((image, index) => (
              <span
                key={`${image.src}-${index}`}
                className={`h-[6px] rounded-full transition-all duration-300 ${
                  index === active ? "w-[18px] bg-ink" : "w-[6px] bg-line-strong"
                }`}
              />
            ))}
          </div>

          <div className="hidden grid-cols-[repeat(4,minmax(0,1fr))] gap-[12px] md:grid">
            {images.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Prikaži sliku ${index + 1} od ${images.length}`}
                aria-pressed={index === active}
                className={`cursor-pointer outline-offset-2 transition-opacity duration-300 ${
                  index === active ? "outline-2 outline-ink" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Placeholder
                  label={image.label}
                  variant="thumb"
                  src={image.src}
                  sizes="12vw"
                  className="aspect-square"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
