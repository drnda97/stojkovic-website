"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { categoryLabels, products, type Category } from "@/data/products";
import { formatProductCount } from "@/lib/format";

type Filter = "svi" | Category;

const filters: { value: Filter; label: string }[] = [
  { value: "svi", label: "Svi" },
  { value: "klasican", label: categoryLabels.klasican },
  { value: "sa-ukusima", label: categoryLabels["sa-ukusima"] },
  { value: "paket", label: categoryLabels.paket },
];

export function ProductCollection() {
  const [filter, setFilter] = useState<Filter>("svi");
  const visible = filter === "svi" ? products : products.filter((p) => p.category === filter);

  return (
    <>
      <div className="mt-[48px] mb-[40px] flex flex-wrap items-center justify-between gap-[16px] border-b border-line pb-[24px]">
        <div className="flex flex-wrap gap-[10px]">
          {filters.map(({ value, label }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(value)}
                className={`min-h-[44px] cursor-pointer border px-[20px] text-[15px] ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line-strong text-ink hover:border-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="text-[15px] text-muted" aria-live="polite">
          {formatProductCount(visible.length)}
        </div>
      </div>

      {/* auto-fill umesto auto-fit: sa svih osam proizvoda raspored je isti kao u
          referenci, a kada filter ostavi jedan ili dva, kartice zadržavaju širinu
          kolone umesto da se razvuku preko cele strane. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-x-[24px] gap-y-[56px]">
        {visible.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
