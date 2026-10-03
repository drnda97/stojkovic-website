import Link from "next/link";
import { ADMIN_PATH, requireAdmin } from "@/lib/admin-auth";
import { getOrders } from "@/lib/order-store";
import { orderStatusLabels, type OrderStatus } from "@/lib/orders";
import { setOrderStatusAction } from "../actions";
import { formatAmount, formatOrderCount, formatOrderDate, StatusBadge } from "../order-ui";
import { cardClass, PageHeader, quietButtonClass } from "../ui";

type OrdersPageProps = { searchParams: Promise<{ status?: string }> };

const statuses = Object.keys(orderStatusLabels) as OrderStatus[];

/** Šta sledeće može da se uradi sa porudžbinom u datom statusu. */
const nextSteps: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  nova: [
    { status: "poslata", label: "Označi kao poslatu" },
    { status: "otkazana", label: "Otkaži" },
  ],
  poslata: [
    { status: "nova", label: "Vrati u nove" },
    { status: "otkazana", label: "Otkaži" },
  ],
  otkazana: [{ status: "nova", label: "Vrati u nove" }],
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = statuses.find((candidate) => candidate === status);

  const all = (await getOrders()).reverse();
  const orders = active ? all.filter((order) => order.status === active) : all;
  const tabs = [
    {
      href: `${ADMIN_PATH}/porudzbine`,
      label: "Sve",
      count: all.length,
      current: !active,
    },
    ...statuses.map((value) => ({
      href: `${ADMIN_PATH}/porudzbine?status=${value}`,
      label: orderStatusLabels[value],
      count: all.filter((order) => order.status === value).length,
      current: active === value,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Porudžbine"
        hint="Najnovije su na vrhu. Kupac plaća kuriru pouzećem; ovde samo pratite šta je poslato."
      />

      <div className="mb-[16px] flex flex-wrap gap-[8px]">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.current ? "page" : undefined}
            className={`inline-flex min-h-[40px] items-center rounded-[6px] border px-[14px] text-[14px] ${
              tab.current
                ? "border-ink bg-ink text-paper hover:text-paper"
                : "border-line-strong bg-white hover:border-ink hover:text-ink"
            }`}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {orders.length === 0 && (
        <p className={`${cardClass} text-[15px] text-muted`}>
          {all.length === 0
            ? "Još nema porudžbina. Čim kupac poruči sa sajta, porudžbina se pojavljuje ovde."
            : "Nema porudžbina u ovom statusu."}
        </p>
      )}

      <div className="flex flex-col gap-[12px]">
        {orders.map((order) => (
          <article key={order.number} className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-[12px]">
              <h2 className="text-[18px]">
                #{order.number} · {order.customer.name}
              </h2>
              <div className="flex items-center gap-[10px] text-[14px] text-muted">
                {formatOrderDate(order.receivedAt)}
                <StatusBadge status={order.status} />
              </div>
            </div>

            <div className="mt-[12px] grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-[16px] text-[15px]">
              <div className="flex flex-col gap-[2px]">
                <a
                  href={`tel:${order.customer.phone.replace(/[^+\d]/g, "")}`}
                  className="underline"
                >
                  {order.customer.phone}
                </a>
                {order.customer.email && (
                  <a href={`mailto:${order.customer.email}`} className="underline">
                    {order.customer.email}
                  </a>
                )}
                <div>{order.customer.street}</div>
                <div>
                  {order.customer.postalCode} {order.customer.city}
                </div>
                {order.customer.note && (
                  <div className="mt-[6px] text-muted">Napomena: {order.customer.note}</div>
                )}
              </div>

              <div className="flex flex-col gap-[2px]">
                {order.items.map((item) => (
                  <div key={item.slug} className="flex justify-between gap-[12px]">
                    <span>
                      {item.qty} × {item.name}
                    </span>
                    <span className="shrink-0 text-muted">
                      {formatAmount(item.price === null ? null : item.price * item.qty)}
                    </span>
                  </div>
                ))}
                <div className="mt-[6px] flex justify-between gap-[12px] border-t border-line pt-[6px] text-muted">
                  <span>Dostava</span>
                  <span>{formatAmount(order.delivery)}</span>
                </div>
                <div className="flex justify-between gap-[12px] font-medium">
                  <span>Za naplatu</span>
                  <span>{formatAmount(order.total)}</span>
                </div>
              </div>
            </div>

            {order.emailError && (
              <p className="mt-[12px] rounded-[6px] border border-line-strong px-[12px] py-[8px] text-[14px]">
                Email o ovoj porudžbini nije poslat ({order.emailError}). Proverite podešavanja
                emaila.
              </p>
            )}

            <div className="mt-[16px] flex flex-wrap gap-[8px]">
              {nextSteps[order.status].map((step) => (
                <form key={step.status} action={setOrderStatusAction}>
                  <input type="hidden" name="number" value={order.number} />
                  <input type="hidden" name="status" value={step.status} />
                  <button type="submit" className={quietButtonClass}>
                    {step.label}
                  </button>
                </form>
              ))}
            </div>
          </article>
        ))}
      </div>
      {orders.length > 0 && (
        <p className="mt-[16px] text-[14px] text-muted">
          Prikazano: {formatOrderCount(orders.length)}.
        </p>
      )}
    </>
  );
}
