import type { Metadata } from "next";
import { ProductCollection } from "@/components/product-collection";

export const metadata: Metadata = {
  title: "Sirevi",
  description:
    "Svi kozji sirevi Gazdinstva Stojković: klasičan, sa alevom paprikom, maslinama, začinskim biljem, biberom i degustacioni paket. Ručna proizvodnja, šalju se vakuumirani.",
};

export default function CollectionPage() {
  return (
    <section className="mx-auto box-content max-w-site px-[32px] pt-[72px] pb-[96px]">
      <div className="flex max-w-[640px] flex-col gap-[14px]">
        <div className="text-[12px] tracking-[0.2em] text-brass uppercase">Prodavnica</div>
        <h1 className="text-[length:clamp(44px,5.5vw,72px)] leading-[1.05]">Naši sirevi</h1>
        <p className="text-muted">
          Isti kozji sir u osnovi, različiti začini. Svi se prave ručno, u malim serijama, i šalju
          vakuumirani.
        </p>
      </div>

      <ProductCollection />
    </section>
  );
}
