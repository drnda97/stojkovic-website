import type { ReactNode } from "react";

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** product: harmonika na stranici proizvoda · faq: česta pitanja */
  variant?: "product" | "faq";
};

const variants = {
  product: {
    summary: "min-h-[60px] text-[16px] tracking-[0.04em] after:text-[22px]",
    body: "pb-[20px] text-[16px] text-muted",
  },
  faq: {
    summary:
      "min-h-[76px] gap-[24px] font-serif text-[25px] leading-[1.2] after:font-sans after:text-[24px]",
    body: "pb-[24px] text-muted",
  },
};

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  variant = "product",
}: AccordionItemProps) {
  const styles = variants[variant];

  return (
    <details className="group border-b border-line" open={defaultOpen}>
      <summary
        className={`flex cursor-pointer list-none items-center justify-between after:text-brass after:content-['+'] group-open:after:content-['–'] ${styles.summary}`}
      >
        {title}
      </summary>
      <p className={styles.body}>{children}</p>
    </details>
  );
}
