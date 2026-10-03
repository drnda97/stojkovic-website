import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Porudžbina",
  description: "Ostavite adresu i telefon. Bez naloga i bez plaćanja unapred — plaćate kuriru pouzećem.",
  robots: { index: false },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="leading-[1.6]">
      <header className="border-b border-line">
        <div className="mx-auto box-content flex max-w-site flex-wrap items-center justify-between gap-x-[32px] gap-y-[16px] px-[32px] py-[20px]">
          <Wordmark />
          <Link href="/sirevi" className="border-b border-ink py-[10px] text-[15px]">
            Nazad u prodavnicu
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto box-content flex max-w-site flex-wrap justify-between gap-x-[32px] gap-y-[8px] px-[32px] py-[24px] text-[14px] text-muted">
          <div>© 2026 Poljoprivredno gazdinstvo Stojković</div>
          <div>Pitanja oko porudžbine: {site.phone}</div>
        </div>
      </footer>
    </div>
  );
}
