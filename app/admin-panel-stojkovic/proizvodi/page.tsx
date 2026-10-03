import Link from "next/link";
import { ADMIN_PATH, requireAdmin } from "@/lib/admin-auth";
import { getFilters, getProducts } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { deleteProductAction } from "../actions";
import { ConfirmButton } from "../confirm-button";
import { buttonClass, cardClass, PageHeader, quietButtonClass, rowClass, Thumb } from "../ui";

type ProductsPageProps = { searchParams: Promise<{ greska?: string }> };

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await requireAdmin();
  const { greska } = await searchParams;
  const [products, filters] = await Promise.all([getProducts(), getFilters()]);

  return (
    <>
      <PageHeader
        title="Proizvodi"
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
              </div>
            </div>
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
