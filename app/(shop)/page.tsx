import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/placeholder";
import { ProductCard } from "@/components/product-card";
import { FEATURED_COLLECTION_ID, getCollectionProducts } from "@/data/products";
import { getCollections, getPageImages, getProducts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Početna",
  description:
    "Kozji sir pravljen rukom, od mleka naših koza, soli i začina. Klasičan beli sir ili sa alevom paprikom, maslinama i začinskim biljem — stiže vakuumiran na vašu adresu, plaćate pouzećem.",
};

const eyebrow = "text-[12px] tracking-[0.2em] text-brass uppercase";
const textLink = "border-b border-ink px-0 pt-[10px] pb-[4px] text-[15px]";

export default async function HomePage() {
  const [products, collections, images] = await Promise.all([
    getProducts(),
    getCollections(),
    getPageImages(),
  ]);
  // Izdvojeni sirevi se biraju u admin panelu (kolekcija „Izdvojeni sirevi").
  const featuredCollection = collections.find((collection) => collection.id === FEATURED_COLLECTION_ID);
  const featured = featuredCollection ? getCollectionProducts(featuredCollection, products) : [];

  return (
    <>
      <section className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-[64px] px-[16px] md:px-[32px] py-[72px]">
        <div className="flex flex-col items-start gap-[28px]">
          <div className={eyebrow}>Priroda dobrih ukusa</div>
          <h1 className="text-[length:clamp(46px,6vw,80px)] leading-[1.02] text-balance">
            Kozji sir, pravljen rukom.
          </h1>
          <p className="max-w-[30em] text-[19px] text-muted">
            Od mleka naših koza, soli i začina — i ničeg više. Klasičan beli sir ili sa alevom
            paprikom, maslinama i začinskim biljem, stiže hladan i vakuumiran na vašu adresu.
          </p>
          <Link
            href="/sirevi"
            className="inline-flex min-h-[52px] items-center justify-center bg-ink px-[32px] text-[14px] tracking-[0.14em] text-paper uppercase hover:bg-brass"
          >
            Pogledaj sireve
          </Link>
        </div>
        <Placeholder
          label="Fotografija · kolut kozjeg sira na drvenoj dasci, prirodno svetlo"
          src={images["pocetna-sir"]}
          className="aspect-[4/5]"
        />
      </section>

      <section className="border-y border-line">
        <div className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-[48px] gap-y-[32px] px-[16px] md:px-[32px] py-[44px]">
          <div className="flex flex-col gap-[6px]">
            <h3 className="text-[24px]">Ručna proizvodnja</h3>
            <p className="text-[15px] text-muted">
              Svaki kolut se siri, cedi i soli ručno, u malim serijama.
            </p>
          </div>
          <div className="flex flex-col gap-[6px]">
            <h3 className="text-[24px]">Prirodni sastojci</h3>
            <p className="text-[15px] text-muted">
              Kozje mleko, sirilo, so i pravi začini. Bez konzervansa i aroma.
            </p>
          </div>
          <div className="flex flex-col gap-[6px]">
            <h3 className="text-[24px]">Plaćate kada stigne</h3>
            <p className="text-[15px] text-muted">
              Poručite za minut, platite kuriru pouzećem pri preuzimanju.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto box-content max-w-site px-[16px] md:px-[32px] py-[96px]">
        <div className="mb-[48px] flex flex-wrap items-end justify-between gap-[16px]">
          <div className="flex flex-col gap-[10px]">
            <div className={eyebrow}>Iz naše sirane</div>
            <h2 className="text-[length:clamp(34px,4vw,52px)] leading-[1.1]">Izdvojeni sirevi</h2>
          </div>
          <Link href="/sirevi" className={textLink}>
            Svi sirevi
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-x-[24px] gap-y-[48px]">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-band">
        <div className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-[64px] px-[16px] md:px-[32px] py-[96px]">
          <Placeholder
            label="Fotografija · koze na ispaši na imanju"
            src={images["koze-na-ispasi"]}
            tone="dark"
            className="aspect-square"
          />
          <div className="flex flex-col items-start gap-[24px]">
            <div className={eyebrow}>Naša priča</div>
            <h2 className="text-[length:clamp(34px,4vw,52px)] leading-[1.1] text-balance">
              Dobar sir počinje na pašnjaku.
            </h2>
            <p className="text-muted">
              Koze su izbirljive: biraju lišće, mlade izdanke i bilje koje krave zaobilaze. Zato je
              kozje mleko drugačije, a sir od njega beo, kremast i blago pikantan. Naš posao je da
              to mleko ne pokvarimo — sirimo ga istog dana, polako i bez prečica.
            </p>
            <Link href="/o-nama" className={textLink}>
              Upoznajte gazdinstvo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto box-content max-w-site px-[16px] md:px-[32px] py-[96px]">
        <div className="mb-[48px] flex flex-col gap-[10px]">
          <div className={eyebrow}>Kako se poručuje</div>
          <h2 className="text-[length:clamp(34px,4vw,52px)] leading-[1.1]">
            Tri koraka, bez plaćanja unapred
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-[48px] gap-y-[40px]">
          <div className="flex flex-col gap-[10px] border-t border-ink pt-[20px]">
            <div className="font-serif text-[20px] font-medium text-brass">01</div>
            <h3 className="text-[26px]">Izaberite sireve</h3>
            <p className="text-[16px] text-muted">
              Dodajte u korpu ono što vam se dopada. Nalog nije potreban.
            </p>
          </div>
          <div className="flex flex-col gap-[10px] border-t border-ink pt-[20px]">
            <div className="font-serif text-[20px] font-medium text-brass">02</div>
            <h3 className="text-[26px]">Ostavite adresu</h3>
            <p className="text-[16px] text-muted">
              Ime, adresa i telefon. Javljamo se da potvrdimo porudžbinu i dan slanja.
            </p>
          </div>
          <div className="flex flex-col gap-[10px] border-t border-ink pt-[20px]">
            <div className="font-serif text-[20px] font-medium text-brass">03</div>
            <h3 className="text-[26px]">Platite kuriru</h3>
            <p className="text-[16px] text-muted">
              Paket stiže vakuumiran i rashlađen. Plaćate gotovinom pri preuzimanju.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
