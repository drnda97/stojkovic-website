import Image from "next/image";
import Link from "next/link";

/** Naziv gazdinstva u zaglavlju, ili logo kada je ubačen u admin panelu. */
type WordmarkProps = {
  logo?: string;
  /** U zaglavlju prodavnice natpis je na telefonu centriran, između menija i korpe. */
  centerOnMobile?: boolean;
};

export function Wordmark({ logo, centerOnMobile = false }: WordmarkProps) {
  if (logo) {
    return (
      <Link href="/" className="flex items-center">
        <Image
          src={logo}
          alt="Gazdinstvo Stojković"
          width={240}
          height={56}
          priority
          className="h-[56px] w-auto max-w-[240px] object-contain"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`flex flex-col leading-[1.1] ${centerOnMobile ? "max-md:items-center max-md:text-center" : ""}`}
    >
      <span className="text-[10px] tracking-[0.24em] whitespace-nowrap text-muted uppercase max-[380px]:text-[9px] max-[380px]:tracking-[0.18em]">
        Poljoprivredno gazdinstvo
      </span>
      <span className="font-serif text-[28px] font-medium tracking-[0.12em] uppercase">
        Stojković
      </span>
    </Link>
  );
}
