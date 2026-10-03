import Link from "next/link";
import { Placeholder } from "@/components/placeholder";
import { Price } from "@/components/price";
import { hasWeight, isAvailable, lowStockLabel, salePercent, type Product } from "@/data/products";
import { formatWeight } from "@/lib/format";

type ProductCardProps = {
  product: Product;
  /** Red sa kratkim opisom i gramažom; u „Probajte i ove" ga nema. */
  showTagline?: boolean;
};

const badge = "px-[10px] py-[4px] text-[11px] tracking-[0.14em] uppercase";

export function ProductCard({ product, showTagline = true }: ProductCardProps) {
  const available = isAvailable(product);
  const lowStock = lowStockLabel(product);
  const sale = salePercent(product);

  return (
    <Link href={`/sirevi/${product.slug}`} className="flex flex-col gap-[14px]">
      <div className="relative">
        <Placeholder
          label={`Fotografija · ${product.photo}`}
          src={product.image}
          sizes="(min-width: 1100px) 25vw, (min-width: 600px) 50vw, 100vw"
          className={`aspect-[4/5] ${available ? "" : "opacity-55"}`}
        />
        {/* Oznake u uglu slike: rasprodato, ili akcija i „pri kraju" jedna ispod druge. */}
        <div className="absolute top-[12px] left-[12px] flex flex-col items-start gap-[6px]">
          {!available && <span className={`${badge} bg-ink text-paper`}>Rasprodato</span>}
          {available && sale !== null && (
            <span className={`${badge} bg-brass text-paper`}>Akcija −{sale}%</span>
          )}
          {lowStock && <span className={`${badge} bg-paper text-brass`}>{lowStock}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-[2px]">
        <div className="font-serif text-[25px] leading-[1.2] font-medium">{product.name}</div>
        {showTagline && (
          <div className="text-[14px] text-muted">
            {[product.tagline, hasWeight(product) && formatWeight(product.weight)]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}
        <div className="text-[15px]">
          <Price product={product} />
        </div>
      </div>
    </Link>
  );
}
