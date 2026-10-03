"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { Wordmark } from "@/components/wordmark";
import { site } from "@/data/site";
import { formatPieces } from "@/lib/format";

const links = [
  { href: "/sirevi", label: "Sirevi" },
  { href: "/o-nama", label: "O nama" },
  { href: "/cesta-pitanja", label: "Česta pitanja" },
];

const iconButton = "relative flex size-[44px] cursor-pointer items-center justify-center text-ink";
// Ista kriva za otvaranje menija i za njegove delove, da se sve kreće kao jedno.
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const REVEAL_MS = 700;

function CartButton() {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count > 0 ? `Korpa, ${formatPieces(count)}` : "Korpa, prazna"}
      className={`${iconButton} hover:text-brass`}
    >
      {/* Korpa iz koje viri kriška sira. */}
      <svg
        viewBox="1.5 2.5 21 19"
        width="32"
        height="29"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8.2 10.5 14.6 5.2a.8.8 0 0 1 1.2.2l2.6 5.1" />
        <circle cx="14.3" cy="8.6" r=".9" fill="currentColor" stroke="none" />
        <path d="M3 10.5h18" />
        <path d="M4.3 10.5 5.7 18.4a1.6 1.6 0 0 0 1.6 1.3h9.4a1.6 1.6 0 0 0 1.6-1.3l1.4-7.9" />
        <path d="M9.2 13.6v3.2M12 13.6v3.2M14.8 13.6v3.2" />
      </svg>
      {count > 0 && (
        <span
          // Novi ključ pri svakoj promeni broja, da značka „poskoči" kada se nešto doda.
          key={count}
          className="absolute top-[0px] right-[-4px] flex h-[19px] min-w-[19px] animate-cheese-pop items-center justify-center rounded-full bg-brass px-[5px] text-[11px] leading-none font-medium text-paper"
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Kolut sira koji se polako okreće u uglu otvorenog menija. */
function MenuWheel() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="pointer-events-none absolute right-[-90px] bottom-[-90px] size-[320px] animate-[spin_50s_linear_infinite] text-brass-light opacity-[0.16] motion-reduce:animate-none"
    >
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <g fill="currentColor">
        <circle cx="64" cy="62" r="13" />
        <circle cx="128" cy="52" r="8" />
        <circle cx="138" cy="118" r="16" />
        <circle cx="70" cy="132" r="10" />
        <circle cx="102" cy="96" r="6" />
        <circle cx="108" cy="150" r="5" />
      </g>
      <path d="M100 100 100 4M100 100 183 148" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Header({ logo }: { logo?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Sredina dugmeta: odatle se meni širi u krug, kao kolut koji raste.
  const [origin, setOrigin] = useState({ x: 38, y: 80 });

  function toggleMenu() {
    const rect = toggleRef.current?.getBoundingClientRect();
    if (rect) setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setMenuOpen((open) => !open);
  }

  // Dok je meni otvoren: Esc zatvara, Tab ostaje u meniju, stranica iza se ne skroluje.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !menuRef.current || !toggleRef.current) return;

      const focusable = [
        toggleRef.current,
        ...Array.from(menuRef.current.querySelectorAll<HTMLElement>("a[href], button")),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!focusable.includes(active as HTMLElement)) {
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

    // Kada se prozor raširi do veličine na kojoj se vidi obična navigacija, meni se zatvara.
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  const bar =
    "absolute left-1/2 h-[1.5px] w-[22px] -translate-x-1/2 bg-current transition-all duration-500";

  return (
    <header className="border-b border-line">
      <div className="mx-auto box-content grid max-w-site grid-cols-[44px_1fr_44px] items-center gap-x-[12px] px-[16px] py-[14px] md:flex md:justify-between md:gap-x-[32px] md:px-[32px] md:py-[20px]">
        <button
          ref={toggleRef}
          type="button"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Zatvori meni" : "Otvori meni"}
          aria-expanded={menuOpen}
          aria-controls="glavni-meni"
          // Iznad otvorenog menija, gde tri crte postaju krstić.
          className={`${iconButton} z-[70] transition-colors duration-500 md:hidden ${menuOpen ? "text-paper" : ""}`}
        >
          <span
            className={`${bar} ${menuOpen ? "top-[21px] rotate-45" : "top-[14px]"}`}
            style={{ transitionTimingFunction: EASE }}
          />
          <span
            className={`${bar} top-[21px] ${menuOpen ? "scale-x-0 opacity-0" : ""}`}
            style={{ transitionTimingFunction: EASE }}
          />
          <span
            className={`${bar} ${menuOpen ? "top-[21px] -rotate-45" : "top-[28px]"}`}
            style={{ transitionTimingFunction: EASE }}
          />
        </button>

        <div className="flex justify-center md:justify-start">
          <Wordmark logo={logo} centerOnMobile />
        </div>

        <nav className="hidden flex-wrap gap-x-[36px] gap-y-[8px] text-[15px] tracking-[0.04em] md:flex">
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

        <CartButton />
      </div>

      {/* Meni na telefonu: preko celog ekrana, širi se u krug iz dugmeta. Uvek je u
          stranici (zatvoren je nevidljiv i `inert`), da bi i zatvaranje bilo animirano. */}
      <div
        ref={menuRef}
        id="glavni-meni"
        role="dialog"
        aria-modal="true"
        aria-label="Meni"
        inert={!menuOpen}
        className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-ink px-[32px] pt-[120px] pb-[40px] text-paper motion-reduce:transition-none md:hidden"
        style={{
          clipPath: `circle(${menuOpen ? "150vmax" : "0px"} at ${origin.x}px ${origin.y}px)`,
          visibility: menuOpen ? "visible" : "hidden",
          transition: `clip-path ${REVEAL_MS}ms ${EASE}, visibility 0s linear ${menuOpen ? 0 : REVEAL_MS}ms`,
        }}
      >
        <MenuWheel />

        <nav className="flex flex-col gap-[6px]">
          {[{ href: "/", label: "Početna" }, ...links].map((link, index) => {
            const active = pathname === link.href;
            return (
              // Svaka stavka izranja iza svoje ivice, jedna za drugom.
              <div key={link.href} className="overflow-hidden">
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`block py-[6px] font-serif text-[34px] leading-[1.15] transition-[translate,opacity] duration-700 hover:text-brass-light motion-reduce:transition-none ${
                    active ? "text-brass-light" : ""
                  } ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
                  style={{
                    transitionTimingFunction: EASE,
                    transitionDelay: menuOpen ? `${180 + index * 80}ms` : "0ms",
                  }}
                >
                  {link.label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div
          className={`mt-auto flex flex-col gap-[6px] border-t border-line-dark pt-[20px] text-[15px] text-footer-text transition-opacity duration-700 motion-reduce:transition-none ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: menuOpen ? "560ms" : "0ms" }}
        >
          <div>Plaćanje pouzećem · Dostava širom Srbije</div>
          <a href={site.instagramUrl} className="self-start py-[6px] text-paper underline">
            {site.instagramLabel}
          </a>
        </div>
      </div>
    </header>
  );
}
