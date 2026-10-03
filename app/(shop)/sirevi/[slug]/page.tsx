import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccordionItem } from "@/components/accordion";
import { AddToCart } from "@/components/add-to-cart";
import { Price } from "@/components/price";
import { ProductCard } from "@/components/product-card";
import { ProductGallery, type GalleryImage } from "@/components/product-gallery";
import type { PageImageId } from "@/data/page-images";
import {
  getRelatedProducts,
  hasWeight,
  isAvailable,
  lowStockLabel,
  salePercent,
} from "@/data/products";
import { site } from "@/data/site";
import { getFilters, getPageImages, getProduct, getProducts } from "@/lib/content";
import { maxQty } from "@/lib/cart";
import { formatPrice, formatWeight } from "@/lib/format";

type ProductPageProps = { params: Promise<{ slug: string }> };

/** Zajedničke fotografije (admin → Stranice → Stranica proizvoda) za proizvode bez svoje galerije. */
const sharedThumbs: { label: string; slot: PageImageId }[] = [
  { label: "Odozgo", slot: "galerija-odozgo" },
  { label: "Pakovanje", slot: "galerija-pakovanje" },
  { label: "Na tanjiru", slot: "galerija-na-tanjiru" },
];

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return { title: product.fullName, description: product.intro };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [products, filters, images] = await Promise.all([
    getProducts(),
    getFilters(),
    getPageImages(),
  ]);
  const product = products.find((candidate) => candidate.slug === slug);
  if (!product) notFound();
  // Galerija: glavna slika proizvoda, pa njegove dodatne slike. Proizvod koji ih još nema
  // dobija tri zajedničke fotografije, da galerija ne ostane prazna.
  const own = product.gallery ?? [];
  const gallery: GalleryImage[] = [
    { src: product.image, label: `Fotografija · ${product.photoMain}` },
    ...(own.length > 0
      ? own.map((src, index) => ({ src, label: `${product.fullName}, slika ${index + 2}` }))
      : sharedThumbs.map((thumb) => ({ src: images[thumb.slot], label: thumb.label }))),
  ];
  const lowStock = lowStockLabel(product);
  const sale = isAvailable(product) ? salePercent(product) : null;
  const eyebrow =
    filters.find((filter) => filter.id === product.category)?.eyebrow ?? product.eyebrow;

  return (
    <>
      <div className="mx-auto box-content flex max-w-site flex-wrap gap-[10px] px-[16px] md:px-[32px] pt-[28px] text-[14px] text-muted">
        <Link href="/">Početna</Link>
        <span>/</span>
        <Link href="/sirevi">Sirevi</Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </div>

      <section className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-[64px] px-[16px] md:px-[32px] pt-[32px] pb-[96px]">
        <ProductGallery images={gallery} />

        <div className="flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[10px]">
            <div className="text-[12px] tracking-[0.2em] text-brass uppercase">{eyebrow}</div>
            <h1 className="text-[length:clamp(40px,4.5vw,60px)] leading-[1.05] text-balance">
              {product.fullName}
            </h1>
            <div className="text-[22px]">
              <Price product={product} />{" "}
              <span className="text-[15px] text-muted">
                · {hasWeight(product) && `${formatWeight(product.weight)}, `}vakuumirano
              </span>
            </div>
          </div>
          <p className="text-muted">{product.intro}</p>

          <div className="flex flex-col gap-[10px]">
            {(lowStock || sale !== null) && (
              <div className="flex flex-wrap gap-[8px] text-[11px] tracking-[0.14em] uppercase">
                {sale !== null && (
                  <span className="bg-brass px-[10px] py-[4px] text-paper">Akcija −{sale}%</span>
                )}
                {lowStock && (
                  <span className="border border-brass px-[10px] py-[3px] text-brass">
                    {lowStock}
                  </span>
                )}
              </div>
            )}
            <AddToCart slug={product.slug} available={isAvailable(product)} max={maxQty(product)} />
          </div>

          <div className="flex flex-col gap-[6px] border-t border-line py-[20px] text-[15px] text-muted">
            <div>Plaćanje pouzećem — gotovinom kuriru pri preuzimanju.</div>
            <div>Isporuka za {site.deliveryTime} radna dana, u rashladnom pakovanju.</div>
          </div>

          <div className="border-t border-line">
            <AccordionItem title="Opis" defaultOpen>
              {product.description}
            </AccordionItem>
            <AccordionItem title="Sastojci">{product.ingredients}</AccordionItem>
            <AccordionItem title="Čuvanje">
              U frižideru, na 2–6 °C. Neotvoreno pakovanje traje do datuma na etiketi. Posle
              otvaranja umotajte u papir za pečenje ili stavite u zatvorenu posudu i potrošite za{" "}
              {site.useWithinDays} dana.
            </AccordionItem>
            <AccordionItem title="Dostava i plaćanje">
              Šaljemo {site.shippingDays} kurirskom službom, da paket ne bi čekao vikend u magacinu.
              Cena dostave: {formatPrice(site.deliveryPrice, "[CENA DOSTAVE]")}. Plaćate pouzećem.
            </AccordionItem>
          </div>
        </div>
      </section>

      <section className="bg-band">
        <div className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-start gap-x-[64px] gap-y-[40px] px-[16px] md:px-[32px] py-[80px]">
          <div className="flex flex-col gap-[10px]">
            <div className="text-[12px] tracking-[0.2em] text-brass uppercase">Na stolu</div>
            <h2 className="text-[length:clamp(32px,3.6vw,46px)] leading-[1.1]">
              Uz šta ga služiti
            </h2>
          </div>
          <div className="flex flex-col text-[16px]">
            {product.serving.map((item, index) => (
              <div
                key={item.title}
                className={`border-t py-[16px] ${index === 0 ? "border-ink" : "border-line-mid"}`}
              >
                <span className="font-serif text-[22px] font-medium">{item.title}</span>
                <br />
                <span className="text-muted">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto box-content max-w-site px-[16px] md:px-[32px] py-[96px]">
        <h2 className="mb-[40px] text-[length:clamp(32px,3.6vw,46px)] leading-[1.1]">
          Probajte i ove
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-x-[24px] gap-y-[48px]">
          {getRelatedProducts(products, product.slug).map((related) => (
            <ProductCard key={related.slug} product={related} showTagline={false} />
          ))}
        </div>
      </section>
    </>
  );
}
