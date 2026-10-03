"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { Wordmark } from "@/components/wordmark";

const links = [
  { href: "/sirevi", label: "Sirevi" },
  { href: "/o-nama", label: "O nama" },
  { href: "/cesta-pitanja", label: "Česta pitanja" },
];

export function Header() {
  const pathname = usePathname();
  const { count, openCart } = useCart();

  return (
    <header className="border-b border-line">
      <div className="mx-auto box-content flex max-w-site flex-wrap items-center justify-between gap-x-[32px] gap-y-[16px] px-[32px] py-[20px]">
        <Wordmark />
        <nav className="flex flex-wrap gap-x-[36px] gap-y-[8px] text-[15px] tracking-[0.04em]">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`py-[10px] ${active ? "border-b border-ink" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={openCart}
          className="min-h-[44px] cursor-pointer py-[10px] text-[15px] tracking-[0.04em]"
        >
          Korpa ({count})
        </button>
      </div>
    </header>
  );
}
