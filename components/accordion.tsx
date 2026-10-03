"use client";

import { useId, useState, type ReactNode } from "react";

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** product: harmonika na stranici proizvoda · faq: česta pitanja */
  variant?: "product" | "faq";
};

const variants = {
  product: {
    button: "min-h-[60px] text-[16px] tracking-[0.04em]",
    icon: "size-[14px]",
    body: "pb-[20px] text-[16px] text-muted",
  },
  faq: {
    button: "min-h-[76px] gap-[24px] font-serif text-[25px] leading-[1.2]",
    icon: "size-[16px]",
    body: "pb-[24px] text-muted",
  },
};

const EASE = "ease-[cubic-bezier(0.65,0,0.35,1)]";

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  variant = "product",
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const styles = variants[variant];

  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full cursor-pointer items-center justify-between text-left hover:text-brass ${styles.button}`}
      >
        {title}
        {/* Plus čija se uspravna crta okreće i leže u minus. */}
        <span aria-hidden="true" className={`relative shrink-0 text-brass ${styles.icon}`}>
          <span className="absolute top-1/2 left-0 h-[1.5px] w-full -translate-y-1/2 bg-current" />
          <span
            className={`absolute top-1/2 left-0 h-[1.5px] w-full -translate-y-1/2 bg-current transition-transform duration-500 motion-reduce:transition-none ${EASE} ${open ? "rotate-0" : "rotate-90"}`}
          />
        </span>
      </button>
      {/* Visina se animira preko reda mreže (0fr → 1fr), pa radi za tekst bilo koje dužine.
          Tekst ostaje u stranici i kada je sklopljen, zbog pretraživača. */}
      <div
        id={id}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-500 motion-reduce:transition-none ${EASE} ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p
            className={`transition-[opacity,translate] duration-500 motion-reduce:transition-none ${EASE} ${styles.body} ${open ? "translate-y-0 opacity-100" : "-translate-y-[8px] opacity-0"}`}
          >
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}
