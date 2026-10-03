import Link from "next/link";

export function Wordmark() {
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
