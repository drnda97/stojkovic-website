import { formatPrice } from "@/lib/format";
import { orderStatusLabels, type OrderStatus } from "@/lib/orders";

/** Sitni delovi koje dele Pregled i Porudžbine. */

const dateTimeFormat = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Belgrade",
});
const dayFormat = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Belgrade",
});

export function formatOrderDate(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

export function formatShortDay(date: Date): string {
  return dayFormat.format(date);
}

/** Iznos u RSD, ili crta kada nije poznat (proizvod bez upisane cene). */
export function formatAmount(value: number | null): string {
  return value === null ? "—" : formatPrice(value);
}

/** 1 porudžbina, 2 porudžbine, 5 porudžbina, 21 porudžbina. */
export function formatOrderCount(count: number): string {
  const last = count % 10;
  const teens = count % 100 >= 11 && count % 100 <= 14;
  const word = last >= 2 && last <= 4 && !teens ? "porudžbine" : "porudžbina";
  return `${count} ${word}`;
}

const statusClasses: Record<OrderStatus, string> = {
  nova: "bg-brass text-paper",
  poslata: "border border-line-strong text-ink",
  otkazana: "border border-line text-muted line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-[10px] text-[12px] leading-[22px] ${statusClasses[status]}`}
    >
      {orderStatusLabels[status]}
    </span>
  );
}
