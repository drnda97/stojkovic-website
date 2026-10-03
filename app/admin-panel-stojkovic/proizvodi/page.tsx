import Link from "next/link";
import { ADMIN_PATH, requireAdmin } from "@/lib/admin-auth";
import { getFilters, getProducts } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { currentPrice, isAvailable, isOnSale, lowStockLabel } from "@/data/products";
import { deleteProductAction, setStockAction } from "../actions";
import { ConfirmButton } from "../confirm-button";
import {
  buttonClass,
  cardClass,
  inputClass,
  PageHeader,
  quietButtonClass,
  rowClass,
  Thumb,
} from "../ui";

type ProductsPageProps = { searchParams: Promise<{ greska?: string }> };

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await requireAdmin();
  const { greska } = await searchParams;
  const [products, filters] = await Promise.all([getProducts(), getFilters()]);

  return (
    <>
      <PageHeader
        title="Proizvodi"
        hint="Stanje se menja ovde na klik, ili upisom broja komada kod proizvoda kojima se broj vodi. Vođenje broja i oznaka „pri kraju“ uključuju se u formi proizvoda (Izmeni)."
        error={greska}
        action={
          <Link href={`${ADMIN_PATH}/proizvodi/novi`} className={buttonClass}>
            + Novi proizvod
          </Link>
        }
      />
      <div className={cardClass}>
        {products.map((product) => (
          <div key={product.slug} className={rowClass}>
            <Thumb src={product.image} alt={product.fullName} />
            <div className="min-w-[180px] grow">
              <div className="text-[17px]">{product.fullName}</div>
              <div className="text-[14px] text-muted">
                {filters.find((filter) => filter.id === product.category)?.label ?? "bez filtera"} ·{" "}
                {formatPrice(product.price)}
                {isOnSale(product) && ` → na akciji ${formatPrice(currentPrice(product))}`}
              </div>
              <div className="mt-[6px] flex flex-wrap items-center gap-[8px] text-[13px]">
                <span
                  className={`rounded-full px-[10px] leading-[22px] ${
                    isAvailable(product)
                      ? "border border-line-strong text-ink"
                      : "bg-ink text-paper"
                  }`}
                >
                  {isAvailable(product) ? "Na stanju" : "Nema na stanju"}
                </span>
                {lowStockLabel(product) && (
                  <span className="rounded-full bg-brass px-[10px] leading-[22px] text-paper">
                    Kupac vidi: {lowStockLabel(product)}
                  </span>
                )}
              </div>
            </div>
            {/* Stanje bez otvaranja forme: broj komada ako se vodi, inače prekidač na klik. */}
            {product.stockQty != null ? (
              <form action={setStockAction} className="flex items-center gap-[6px]">
                <input type="hidden" name="slug" value={product.slug} />
                <div className="w-[84px] shrink-0">
                  <input
                    name="stockQty"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={product.stockQty}
                    aria-label={`Broj komada na stanju: ${product.fullName}`}
                    className={inputClass}
                  />
                </div>
                <button type="submit" className={`${quietButtonClass} whitespace-nowrap`}>
                  Sačuvaj
                </button>
              </form>
            ) : (
              <form action={setStockAction}>
                <input type="hidden" name="slug" value={product.slug} />
                <button type="submit" className={quietButtonClass}>
                  {isAvailable(product) ? "Označi da nema" : "Vrati na stanje"}
                </button>
              </form>
            )}
            <Link
              href={`/sirevi/${product.slug}`}
              target="_blank"
              className="text-[14px] underline"
            >
              Na sajtu ↗
            </Link>
            <Link href={`${ADMIN_PATH}/proizvodi/${product.slug}`} className={quietButtonClass}>
              Izmeni
            </Link>
            <form action={deleteProductAction}>
              <input type="hidden" name="slug" value={product.slug} />
              <ConfirmButton
                question={`Obrisati proizvod „${product.fullName}"?`}
                className={quietButtonClass}
              >
                Obriši
              </ConfirmButton>
            </form>
          </div>
        ))}
        {products.length === 0 && <p className="text-[15px] text-muted">Nema proizvoda.</p>}
      </div>
    </>
  );
}
