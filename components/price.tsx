import { currentPrice, isOnSale, type Product } from "@/data/products";
import { formatPrice } from "@/lib/format";

/** Cena proizvoda; kada je na akciji, stara cena je precrtana ispred nove. */
export function Price({ product }: { product: Product }) {
  if (!isOnSale(product)) return <>{formatPrice(product.price)}</>;

  return (
    <>
      <del className="mr-[8px] text-muted">
        <span className="sr-only">Stara cena: </span>
        {formatPrice(product.price)}
      </del>
      <ins className="text-brass no-underline">
        <span className="sr-only">Cena na akciji: </span>
        {formatPrice(currentPrice(product))}
      </ins>
    </>
  );
}
