import Link from "next/link";
import { triggerLabels, type Discount, type DiscountTrigger } from "@/data/discounts";
import { ADMIN_PATH } from "@/lib/admin-auth";
import { saveDiscountAction } from "../actions";
import {
  buttonClass,
  cardClass,
  inputClass,
  labelClass,
  PageHeader,
  quietButtonClass,
} from "../ui";

type DiscountFormProps = {
  /** Popust koji se menja; bez njega forma dodaje novi. */
  discount?: Discount;
  error?: string;
};

export function DiscountForm({ discount, error }: DiscountFormProps) {
  const backPath = `${ADMIN_PATH}/popusti`;

  return (
    <>
      <Link href={backPath} className="text-[14px] underline">
        ← Popusti
      </Link>
      <div className="mt-[12px]">
        <PageHeader title={discount ? discount.name : "Novi popust"} error={error} />
      </div>

      <form
        action={saveDiscountAction}
        className={`${cardClass} flex max-w-[680px] flex-col gap-[16px]`}
      >
        <input type="hidden" name="id" value={discount?.id ?? ""} />
        <label className={labelClass}>
          Naslov * — kupac ga vidi u emailu, iznad koda
          <input
            name="name"
            required
            defaultValue={discount?.name}
            placeholder="npr. Hvala na prvoj porudžbini"
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} max-w-[320px]`}>
          Kod koji kupac upisuje u korpi
          <input
            name="code"
            defaultValue={discount?.code}
            placeholder="npr. SIR10"
            autoComplete="off"
            maxLength={32}
            className={`${inputClass} tracking-[0.06em] uppercase`}
          />
        </label>
        <p className="mt-[-8px] text-[14px] text-muted">
          Slova bez kvačica, cifre i crtica. Ako polje ostane prazno, svaki kupac dobija svoj
          nasumičan kod (npr. SIR-7K3Q9X). Kod važi za jednu kupovinu i samo za kupca kome je poslat
          — isti email ili telefon.
        </p>
        <label className={`${labelClass} max-w-[200px]`}>
          Popust (%) *
          <input
            name="percent"
            type="number"
            min="1"
            max="100"
            step="1"
            required
            defaultValue={discount?.percent}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-[16px]">
          <label className={labelClass}>
            Kada se šalje
            <select
              name="trigger"
              defaultValue={discount?.trigger ?? "amount"}
              className={inputClass}
            >
              {(Object.keys(triggerLabels) as DiscountTrigger[]).map((trigger) => (
                <option key={trigger} value={trigger}>
                  {triggerLabels[trigger]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Prag: dinari ili grami, prema izboru levo
            <input
              name="threshold"
              type="number"
              min="0"
              step="1"
              defaultValue={discount && discount.trigger !== "first" ? discount.threshold : ""}
              className={inputClass}
            />
          </label>
        </div>
        <p className="mt-[-8px] text-[14px] text-muted">
          Za prvu porudžbinu prag se ne upisuje. Vrednost porudžbine je zbir proizvoda posle
          popusta, bez dostave. U težinu ulaze samo proizvodi sa gramažom, ne i paketi.
        </p>

        <label className={`${labelClass} max-w-[320px]`}>
          Status
          <select name="status" defaultValue={discount?.status ?? "draft"} className={inputClass}>
            <option value="draft">Nacrt — ne šalje se</option>
            <option value="active">Aktivan — šalje se kupcima</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-[12px] pt-[8px]">
          <button type="submit" className={buttonClass}>
            Sačuvaj
          </button>
          <Link href={backPath} className={quietButtonClass}>
            Odustani
          </Link>
        </div>
      </form>
    </>
  );
}
