import Link from "next/link";
import { Placeholder } from "@/components/placeholder";
import { hasWeight, type Product } from "@/data/products";
import { formatPrice, formatWeight } from "@/lib/format";

type ProductCardProps = {
  product: Product;
  /** Red sa kratkim opisom i gramažom; u „Probajte i ove" ga nema. */
  showTagline?: boolean;
};

export function ProductCard({ product, showTagline = true }: ProductCardProps) {
  return (
    <Link href={`/sirevi/${product.slug}`} className="flex flex-col gap-[14px]">
      <Placeholder
        label={`Fotografija · ${product.photo}`}
        src={product.image}
        sizes="(min-width: 1100px) 25vw, (min-width: 600px) 50vw, 100vw"
        className="aspect-[4/5]"
      />
      <div className="flex flex-col gap-[2px]">
        <div className="font-serif text-[25px] leading-[1.2] font-medium">{product.name}</div>
        {showTagline && (
          <div className="text-[14px] text-muted">
            {product.tagline}
            {hasWeight(product) && ` · ${formatWeight(product.weight)}`}
          </div>
        )}
        <div className="text-[15px]">{formatPrice(product.price)}</div>
      </div>
    </Link>
  );
}
