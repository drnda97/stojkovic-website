import { requireAdmin } from "@/lib/admin-auth";
import { getFilters, getProducts } from "@/lib/content";
import { formatProductCount } from "@/lib/format";
import { createFilterAction, deleteFilterAction, saveFilterAction } from "../actions";
import { ConfirmButton } from "../confirm-button";
import {
  buttonClass,
  cardClass,
  inputClass,
  labelClass,
  PageHeader,
  quietButtonClass,
} from "../ui";

type FiltersPageProps = { searchParams: Promise<{ greska?: string }> };

const fieldClass = `${labelClass} min-w-[180px] grow basis-0`;

export default async function FiltersPage({ searchParams }: FiltersPageProps) {
  await requireAdmin();
  const { greska } = await searchParams;
  const [filters, products] = await Promise.all([getFilters(), getProducts()]);

  return (
    <>
      <PageHeader
        title="Filteri"
        hint="Dugmad na strani „Sirevi“ kojima kupac sužava spisak. Svaki proizvod pripada jednom filteru, koji se bira u formi proizvoda."
        error={greska}
      />
      <div className={`${cardClass} flex flex-col`}>
        {filters.map((filter) => {
          const count = products.filter((product) => product.category === filter.id).length;
          return (
            <div
              key={filter.id}
              className="flex flex-wrap items-end gap-[12px] border-t border-line py-[16px] first:border-t-0 first:pt-0 last:pb-0"
            >
              <form action={saveFilterAction} className="flex grow flex-wrap items-end gap-[12px]">
                <input type="hidden" name="id" value={filter.id} />
                <label className={fieldClass}>
                  Naziv na dugmetu
                  <input name="label" required defaultValue={filter.label} className={inputClass} />
                </label>
                <label className={fieldClass}>
                  Natpis iznad naslova proizvoda
                  <input name="eyebrow" defaultValue={filter.eyebrow} className={inputClass} />
                </label>
                <button type="submit" className={quietButtonClass}>
                  Sačuvaj
                </button>
              </form>
              <form action={deleteFilterAction}>
                <input type="hidden" name="id" value={filter.id} />
                <ConfirmButton
                  question={`Obrisati filter „${filter.label}"?`}
                  className={quietButtonClass}
                >
                  Obriši
                </ConfirmButton>
              </form>
              <div className="w-full text-[13px] text-muted">{formatProductCount(count)}</div>
            </div>
          );
        })}
        {filters.length === 0 && <p className="text-[15px] text-muted">Nema filtera.</p>}
      </div>

      <form
        action={createFilterAction}
        className={`${cardClass} mt-[16px] flex flex-wrap items-end gap-[12px]`}
      >
        <label className={fieldClass}>
          Novi filter
          <input name="label" required placeholder="npr. Dimljeni" className={inputClass} />
        </label>
        <label className={fieldClass}>
          Natpis iznad naslova proizvoda
          <input name="eyebrow" placeholder="npr. Dimljeni kozji sir" className={inputClass} />
        </label>
        <button type="submit" className={buttonClass}>
          Dodaj filter
        </button>
      </form>
    </>
  );
}
