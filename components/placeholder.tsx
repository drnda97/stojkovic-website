import Image from "next/image";

type PlaceholderProps = {
  /** Natpis u okviru („Fotografija · …"); kada slika stigne, postaje njen alt tekst. */
  label: string;
  /** Dimenzije okvira: odnos stranica (npr. "aspect-[4/5]") ili fiksna širina i visina. */
  className: string;
  /** frame: velika fotografija · thumb: mala u galeriji · mini: sličica u korpi i porudžbini */
  variant?: "frame" | "thumb" | "mini";
  /** dark: za tamniju traku (#EFE8DA) */
  tone?: "light" | "dark";
  /** Putanja do slike. Kada se prosledi, okvir zadržava iste dimenzije, a natpis zamenjuje slika. */
  src?: string;
  /** `sizes` za next/image, kada postoji `src`. */
  sizes?: string;
};

const variants = {
  frame: "p-[24px] text-[12px]",
  thumb: "p-[8px] text-[12px]",
  mini: "text-[10px]",
};

/**
 * Mesto za fotografiju koja stiže kasnije. Raspored zavisi samo od `className`,
 * pa se prelazak na pravu sliku svodi na prosleđivanje `src`.
 */
export function Placeholder({
  label,
  className,
  variant = "frame",
  tone = "light",
  src,
  sizes = "(min-width: 900px) 50vw, 100vw",
}: PlaceholderProps) {
  const background = tone === "dark" ? "bg-ph-dark" : "bg-ph";

  if (src) {
    return (
      <div className={`relative overflow-hidden ${background} ${className}`}>
        <Image src={src} alt={label} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center text-center tracking-[0.14em] text-muted uppercase ${background} ${variants[variant]} ${className}`}
    >
      {label}
    </div>
  );
}
