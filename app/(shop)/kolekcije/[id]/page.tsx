import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getCollectionProducts } from "@/data/products";
import { getCollections, getProducts } from "@/lib/content";

type CollectionPageProps = { params: Promise<{ id: string }> };

async function findCollection(id: string) {
  return (await getCollections()).find((collection) => collection.id === id);
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const collection = await findCollection((await params).id);
  if (!collection) return {};
  return { title: collection.name, description: collection.description || undefined };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const collection = await findCollection((await params).id);
  if (!collection) notFound();
  const products = getCollectionProducts(collection, await getProducts());

  return (
    <section className="mx-auto box-content max-w-site px-[16px] md:px-[32px] pt-[72px] pb-[96px]">
      <div className="mb-[56px] flex max-w-[640px] flex-col gap-[14px]">
        <div className="text-[12px] tracking-[0.2em] text-brass uppercase">Kolekcija</div>
        <h1 className="text-[length:clamp(44px,5.5vw,72px)] leading-[1.05]">{collection.name}</h1>
        {collection.description && <p className="text-muted">{collection.description}</p>}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-x-[24px] gap-y-[56px]">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
