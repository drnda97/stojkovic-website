import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getFilters, getProduct } from "@/lib/content";
import { ProductForm } from "../../product-form";

type EditProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ greska?: string }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  await requireAdmin();
  const [{ slug }, { greska }] = await Promise.all([params, searchParams]);
  const [product, filters] = await Promise.all([getProduct(slug), getFilters()]);
  if (!product) notFound();

  return <ProductForm product={product} filters={filters} error={greska} />;
}
