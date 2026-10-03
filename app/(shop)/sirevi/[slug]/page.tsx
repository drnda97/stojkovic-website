import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccordionItem } from "@/components/accordion";
import { AddToCart } from "@/components/add-to-cart";
import { Placeholder } from "@/components/placeholder";
import { ProductCard } from "@/components/product-card";
import type { PageImageId } from "@/data/page-images";
import { getRelatedProducts, hasWeight } from "@/data/products";
import { site } from "@/data/site";
import { getFilters, getPageImages, getProduct, getProducts } from "@/lib/content";
import { formatPrice, formatWeight } from "@/lib/format";

type ProductPageProps = { params: Promise<{ slug: string }> };

/** Male fotografije u galeriji: iste su za sve proizvode, menjaju se u admin panelu. */
const galleryThumbs: { label: string; slot: PageImageId }[] = [
  { label: "Odozgo", slot: "galerija-odozgo" },
  { label: "Pakovanje", slot: "galerija-pakovanje" },
  { label: "Na tanjiru", slot: "galerija-na-tanjiru" },
];

// Proizvodi dodati iz admin panela posle builda prave se pri prvoj poseti.
export async function generateStaticParams() {
  return (await getProducts()).map((product) => ({ slug: product.slug }));
}

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
  const eyebrow = filters.find((filter) => filter.id === product.category)?.eyebrow ?? product.eyebrow;

  return (
    <>
      <div className="mx-auto box-content flex max-w-site flex-wrap gap-[10px] px-[32px] pt-[28px] text-[14px] text-muted">
        <Link href="/">Početna</Link>
        <span>/</span>
        <Link href="/sirevi">Sirevi</Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </div>

      <section className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-[64px] px-[32px] pt-[32px] pb-[96px]">
        <div className="flex flex-col gap-[12px]">
          <Placeholder
            label={`Fotografija · ${product.photoMain}`}
            src={product.image}
            className="aspect-square"
          />
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[12px]">
            {galleryThumbs.map((thumb) => (
              <Placeholder
                key={thumb.label}
                label={thumb.label}
                variant="thumb"
                src={images[thumb.slot]}
                sizes="(min-width: 900px) 17vw, 33vw"
                className="aspect-square"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[10px]">
            <div className="text-[12px] tracking-[0.2em] text-brass uppercase">
              {eyebrow}
            </div>
            <h1 className="text-[length:clamp(40px,4.5vw,60px)] leading-[1.05] text-balance">
              {product.fullName}
            </h1>
            <div className="text-[22px]">
              {formatPrice(product.price)}{" "}
              <span className="text-[15px] text-muted">
                · {hasWeight(product) && `${formatWeight(product.weight)}, `}vakuumirano
              </span>
            </div>
          </div>
          <p className="text-muted">{product.intro}</p>

          <AddToCart slug={product.slug} />

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
        <div className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-start gap-x-[64px] gap-y-[40px] px-[32px] py-[80px]">
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

      <section className="mx-auto box-content max-w-site px-[32px] py-[96px]">
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
