import Link from "next/link";
import { FEATURED_COLLECTION_ID } from "@/data/products";
import { ADMIN_PATH, requireAdmin } from "@/lib/admin-auth";
import { getCollections } from "@/lib/content";
import { formatProductCount } from "@/lib/format";
import { createCollectionAction, deleteCollectionAction } from "../actions";
import { ConfirmButton } from "../confirm-button";
import {
  buttonClass,
  cardClass,
  inputClass,
  labelClass,
  PageHeader,
  quietButtonClass,
  rowClass,
} from "../ui";

type CollectionsPageProps = { searchParams: Promise<{ greska?: string }> };

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  await requireAdmin();
  const { greska } = await searchParams;
  const collections = await getCollections();

  return (
    <>
      <PageHeader
        title="Kolekcije"
        hint="Kolekcija je ručno složena grupa proizvoda sa svojom stranicom na sajtu. Kolekcija „Izdvojeni sirevi“ puni istoimeni deo početne strane."
        error={greska}
      />
      <div className={cardClass}>
        {collections.map((collection) => {
          const featured = collection.id === FEATURED_COLLECTION_ID;
          return (
            <div key={collection.id} className={rowClass}>
              <div className="min-w-[180px] grow">
                <div className="text-[17px]">{collection.name}</div>
                <div className="text-[14px] text-muted">
                  {formatProductCount(collection.productSlugs.length)}
                  {featured && " · prikazuje se na početnoj"}
                </div>
              </div>
              <Link
                href={`/kolekcije/${collection.id}`}
                target="_blank"
                className="text-[14px] underline"
              >
                Na sajtu ↗
              </Link>
              <Link href={`${ADMIN_PATH}/kolekcije/${collection.id}`} className={quietButtonClass}>
                Izmeni
              </Link>
              {!featured && (
                <form action={deleteCollectionAction}>
                  <input type="hidden" name="id" value={collection.id} />
                  <ConfirmButton
                    question={`Obrisati kolekciju „${collection.name}"? Proizvodi ostaju.`}
                    className={quietButtonClass}
                  >
                    Obriši
                  </ConfirmButton>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <form
        action={createCollectionAction}
        className={`${cardClass} mt-[16px] flex flex-wrap items-end gap-[12px]`}
      >
        <label className={`${labelClass} min-w-[220px] grow`}>
          Nova kolekcija
          <input name="name" required placeholder="npr. Za poklon" className={inputClass} />
        </label>
        <button type="submit" className={buttonClass}>
          Dodaj kolekciju
        </button>
      </form>
    </>
  );
}
