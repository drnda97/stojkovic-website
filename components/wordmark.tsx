import Image from "next/image";
import Link from "next/link";

/** Naziv gazdinstva u zaglavlju, ili logo kada je ubačen u admin panelu. */
export function Wordmark({ logo }: { logo?: string }) {
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
    <Link href="/" className="flex flex-col leading-[1.1]">
      <span className="text-[10px] tracking-[0.24em] text-muted uppercase">
        Poljoprivredno gazdinstvo
      </span>
      <span className="font-serif text-[28px] font-medium tracking-[0.12em] uppercase">
        Stojković
      </span>
    </Link>
  );
}
