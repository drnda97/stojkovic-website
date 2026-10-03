import Link from "next/link";
import { ADMIN_PATH, isAdmin } from "@/lib/admin-auth";
import { getProducts, getSettings } from "@/lib/content";
import { formatPieces, formatPrice } from "@/lib/format";
import { isMailConfigured } from "@/lib/order-email";
import { getOrders, getSalesStats } from "@/lib/order-store";
import {
  formatAmount,
  formatOrderCount,
  formatOrderDate,
  formatShortDay,
  StatusBadge,
} from "./order-ui";
import { cardClass, PageHeader } from "./ui";

const sectionTitle = "mb-[12px] text-[17px]";
const textLink = "text-[14px] underline";

/** Promena u odnosu na prethodni period, npr. „↑ 25%". Bez prethodnih podataka nema poređenja. */
function change(current: number, previous: number): string | null {
  if (previous === 0) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return "isto kao prethodnih 30 dana";
  return `${percent > 0 ? "↑" : "↓"} ${Math.abs(percent)}% u odnosu na prethodnih 30 dana`;
}

function StatTile({
  label,
  value,
  notes,
}: {
  label: string;
  value: string;
  notes: (string | null)[];
}) {
  return (
    <div className={cardClass}>
      <div className="text-[14px] text-muted">{label}</div>
      <div className="mt-[4px] text-[30px] leading-[1.2] font-medium">{value}</div>
      {notes.filter(Boolean).map((note) => (
        <div key={note} className="text-[13px] text-muted">
          {note}
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  // Prijavu ovde rešava layout (prikazuje formu), pa se neprijavljenom samo ne daje sadržaj.
  if (!(await isAdmin())) return null;

  const [orders, products, settings] = await Promise.all([
    getOrders(),
    getProducts(),
    getSettings(),
  ]);
  const emailFailed = orders.filter((order) => order.emailError).length;
  const stats = getSalesStats(orders);
  const maxDayOrders = Math.max(1, ...stats.days.map((day) => day.orders));
  const topProducts = stats.topProducts.slice(0, 8);
  const maxProductQty = Math.max(1, ...topProducts.map((product) => product.qty));
  const neverSold = products.filter(
    (product) => !stats.topProducts.some((sold) => sold.slug === product.slug),
  );
  const withoutPrice = products.filter((product) => product.price === null);
  const withoutImage = products.filter((product) => !product.image);
  const recent = orders.slice(-5).reverse();

  const attention = [
    !isMailConfigured(settings) && {
      text: "Email nije podešen — za nove porudžbine ne stiže poruka ni vama ni kupcu",
      href: `${ADMIN_PATH}/podesavanja`,
    },
    emailFailed > 0 && {
      text: `Email nije poslat: ${formatOrderCount(emailFailed)}`,
      href: `${ADMIN_PATH}/porudzbine`,
    },
    stats.waiting > 0 && {
      text: `Čeka na slanje: ${formatOrderCount(stats.waiting)}`,
      href: `${ADMIN_PATH}/porudzbine?status=nova`,
    },
    withoutPrice.length > 0 && {
      text: `Bez upisane cene: ${withoutPrice.length} (${withoutPrice.map((product) => product.name).join(", ")})`,
      href: `${ADMIN_PATH}/proizvodi`,
    },
    withoutImage.length > 0 && {
      text: `Bez slike: ${withoutImage.length} (${withoutImage.map((product) => product.name).join(", ")})`,
      href: `${ADMIN_PATH}/proizvodi`,
    },
    stats.unpriced > 0 && {
      text: `Sa proizvodom bez cene: ${formatOrderCount(stats.unpriced)} — prodaja u dinarima je zato nepotpuna`,
      href: `${ADMIN_PATH}/porudzbine`,
    },
  ].filter((item) => item !== false);

  return (
    <>
      <PageHeader
        title="Pregled"
        hint="Prodaja je vrednost poručenih proizvoda bez dostave. Otkazane porudžbine se ne računaju."
      />

      {attention.length > 0 && (
        <div className={`${cardClass} mb-[16px]`}>
          <h2 className={sectionTitle}>Za pažnju</h2>
          <ul className="flex flex-col gap-[6px] text-[15px]">
            {attention.map((item) => (
              <li key={item.text}>
                <Link href={item.href} className="underline">
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(176px,100%),1fr))] gap-[16px]">
        <StatTile
          label="Prodaja · poslednjih 30 dana"
          value={formatPrice(stats.last30.sales)}
          notes={[
            change(stats.last30.sales, stats.previous30.sales),
            `Ukupno do sada: ${formatPrice(stats.all.sales)}`,
          ]}
        />
        <StatTile
          label="Porudžbine · poslednjih 30 dana"
          value={String(stats.last30.orders)}
          notes={[
            change(stats.last30.orders, stats.previous30.orders),
            `Poslednjih 7 dana: ${stats.last7.orders} · ukupno: ${stats.all.orders}`,
          ]}
        />
        <StatTile
          label="Prosečna porudžbina"
          value={stats.all.average === null ? "—" : formatPrice(stats.all.average)}
          notes={[
            stats.all.orders > 0
              ? `U proseku ${(stats.all.pieces / stats.all.orders).toFixed(1).replace(".", ",")} komada po porudžbini`
              : null,
          ]}
        />
        <StatTile
          label="Prodato komada"
          value={String(stats.all.pieces)}
          notes={[`Poslednjih 30 dana: ${stats.last30.pieces}`]}
        />
        <StatTile
          label="Kupci"
          value={String(stats.customers)}
          notes={[
            `Poručili više puta: ${stats.returningCustomers}`,
            stats.cancelled > 0 ? `Otkazano: ${formatOrderCount(stats.cancelled)}` : null,
          ]}
        />
      </div>

      <div className={`${cardClass} mt-[16px]`}>
        <h2 className={sectionTitle}>Porudžbine po danima · poslednjih 30 dana</h2>
        {stats.last30.orders === 0 ? (
          <p className="text-[15px] text-muted">U poslednjih 30 dana nema porudžbina.</p>
        ) : (
          <>
            <div className="flex gap-[8px]">
              <div className="flex h-[160px] flex-col justify-between text-right text-[12px] leading-none text-muted">
                <span>{maxDayOrders}</span>
                <span>0</span>
              </div>
              <div className="flex h-[160px] grow gap-[2px] border-b border-line-strong">
                {stats.days.map((day, index) => (
                  // Cela kolona je meta za miš i tastaturu, ne samo tanak stubić.
                  <div
                    key={day.key}
                    tabIndex={0}
                    className="group relative flex min-w-0 grow items-end justify-center hover:bg-band focus-visible:bg-band"
                  >
                    {day.orders > 0 && (
                      <div
                        className="w-full max-w-[18px] rounded-t-[4px] bg-brass"
                        style={{
                          height: `${(day.orders / maxDayOrders) * 100}%`,
                        }}
                      />
                    )}
                    <div
                      role="tooltip"
                      className={`pointer-events-none absolute bottom-full z-10 mb-[6px] hidden rounded-[6px] bg-ink px-[10px] py-[6px] text-[13px] leading-[1.4] whitespace-nowrap text-paper group-hover:block group-focus-visible:block ${
                        index < 5 ? "left-0" : index > 24 ? "right-0" : ""
                      }`}
                    >
                      <div>{formatShortDay(day.date)}</div>
                      <div>
                        {formatOrderCount(day.orders)} · {formatPrice(day.sales)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-[6px] flex justify-between pl-[24px] text-[12px] text-muted">
              <span>{formatShortDay(stats.days[0].date)}</span>
              <span>{formatShortDay(stats.days[14].date)}</span>
              <span>danas</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-[16px] grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] items-start gap-[16px]">
        <div className={cardClass}>
          <h2 className={sectionTitle}>Najprodavaniji proizvodi</h2>
          {topProducts.length === 0 ? (
            <p className="text-[15px] text-muted">
              Još nema porudžbina. Kada stignu, ovde se vidi koji sir se najviše prodaje.
            </p>
          ) : (
            <ol className="flex flex-col gap-[14px]">
              {topProducts.map((product, index) => (
                <li key={product.slug} className="flex flex-col gap-[4px]">
                  <div className="flex items-baseline justify-between gap-[12px] text-[15px]">
                    <span>
                      {index + 1}. {product.name}
                    </span>
                    <span className="shrink-0 text-[14px] text-muted">
                      {formatPieces(product.qty)} · {formatPrice(product.sales)}
                    </span>
                  </div>
                  <div className="h-[8px] rounded-[4px] bg-band">
                    <div
                      className="h-full rounded-[4px] bg-brass"
                      style={{
                        width: `${(product.qty / maxProductQty) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
          {topProducts.length > 0 && neverSold.length > 0 && (
            <p className="mt-[16px] border-t border-line pt-[12px] text-[14px] text-muted">
              Još nijednom poručeno: {neverSold.map((product) => product.name).join(", ")}.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-[16px]">
          <div className={cardClass}>
            <div className="flex items-baseline justify-between gap-[12px]">
              <h2 className={sectionTitle}>Poslednje porudžbine</h2>
              <Link href={`${ADMIN_PATH}/porudzbine`} className={textLink}>
                Sve porudžbine
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-[15px] text-muted">Još nema porudžbina.</p>
            ) : (
              <div className="flex flex-col">
                {recent.map((order) => (
                  <div
                    key={order.number}
                    className="flex flex-wrap items-center justify-between gap-x-[12px] gap-y-[2px] border-t border-line py-[10px] text-[15px] first:border-t-0"
                  >
                    <div>
                      <div>
                        #{order.number} · {order.customer.name}
                      </div>
                      <div className="text-[13px] text-muted">
                        {formatOrderDate(order.receivedAt)} · {order.customer.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <span>{formatAmount(order.total)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={cardClass}>
            <h2 className={sectionTitle}>Gde šaljemo najviše</h2>
            {stats.topCities.length === 0 ? (
              <p className="text-[15px] text-muted">Još nema porudžbina.</p>
            ) : (
              <table className="w-full text-[15px]">
                <tbody>
                  {stats.topCities.slice(0, 6).map((city) => (
                    <tr key={city.name} className="border-t border-line first:border-t-0">
                      <td className="py-[8px]">{city.name}</td>
                      <td className="py-[8px] text-right text-muted">
                        {formatOrderCount(city.orders)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
