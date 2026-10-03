import Link from "next/link";
import type { Discount } from "@/data/discounts";
import { ADMIN_PATH, requireAdmin } from "@/lib/admin-auth";
import { getDiscounts } from "@/lib/content";
import { formatPrice, formatWeight } from "@/lib/format";
import { getCodeCounts } from "@/lib/order-store";
import { deleteDiscountAction, toggleDiscountAction } from "../actions";
import { ConfirmButton } from "../confirm-button";
import { buttonClass, cardClass, PageHeader, quietButtonClass, rowClass } from "../ui";

type DiscountsPageProps = { searchParams: Promise<{ greska?: string }> };

/** Uslov pravila rečima, npr. „porudžbina od 3.000 RSD". */
function describeTrigger(discount: Discount): string {
  if (discount.trigger === "first") return "prva porudžbina kupca";
  return discount.trigger === "amount"
    ? `porudžbina od ${formatPrice(discount.threshold)}`
    : `porudžbina od ${formatWeight(discount.threshold)}`;
}

export default async function DiscountsPage({ searchParams }: DiscountsPageProps) {
  await requireAdmin();
  const { greska } = await searchParams;
  const [discounts, counts] = await Promise.all([getDiscounts(), getCodeCounts()]);

  return (
    <>
      <PageHeader
        title="Popusti"
        hint="Posle svake porudžbine kupac u emailu dobija kod za popust pri sledećoj kupovini. Šalje se jedan kod: najjači aktivan popust čiji je uslov ispunjen. Kod važi za jednu kupovinu i samo za kupca kome je poslat; upisuje se u korpi."
        error={greska}
        action={
          <Link href={`${ADMIN_PATH}/popusti/novi`} className={buttonClass}>
            + Novi popust
          </Link>
        }
      />
      <div className={cardClass}>
        {discounts.map((discount) => {
          const active = discount.status === "active";
          const count = counts[discount.id] ?? { sent: 0, used: 0 };
          return (
            <div key={discount.id} className={rowClass}>
              <div className="w-[72px] shrink-0 text-[26px] leading-none font-medium">
                {discount.percent}%
              </div>
              <div className="min-w-[180px] grow">
                <div className="flex flex-wrap items-center gap-[8px] text-[17px]">
                  {discount.name}
                  <span
                    className={`rounded-full px-[10px] text-[12px] leading-[22px] ${
                      active ? "bg-brass text-paper" : "border border-line-strong text-muted"
                    }`}
                  >
                    {active ? "Aktivan" : "Nacrt"}
                  </span>
                </div>
                <div className="text-[14px] text-muted">
                  Kod: {discount.code || "nasumičan za svakog kupca"} · šalje se:{" "}
                  {describeTrigger(discount)} · poslato kodova: {count.sent} · iskorišćeno:{" "}
                  {count.used}
                </div>
              </div>
              <form action={toggleDiscountAction}>
                <input type="hidden" name="id" value={discount.id} />
                <button type="submit" className={quietButtonClass}>
                  {active ? "Vrati u nacrt" : "Aktiviraj"}
                </button>
              </form>
              <Link href={`${ADMIN_PATH}/popusti/${discount.id}`} className={quietButtonClass}>
                Izmeni
              </Link>
              <form action={deleteDiscountAction}>
                <input type="hidden" name="id" value={discount.id} />
                <ConfirmButton
                  question={`Obrisati popust „${discount.name}"? Kodovi koji su već poslati kupcima ostaju da važe.`}
                  className={quietButtonClass}
                >
                  Obriši
                </ConfirmButton>
              </form>
            </div>
          );
        })}
        {discounts.length === 0 && (
          <p className="text-[15px] text-muted">
            Još nema popusta. Dok ga ne napravite i aktivirate, kupcima se ne šalje nikakav kod.
          </p>
        )}
      </div>
    </>
  );
}
