import { requireAdmin } from "@/lib/admin-auth";
import { getFilters } from "@/lib/content";
import { ProductForm } from "../../product-form";

type NewProductPageProps = { searchParams: Promise<{ greska?: string }> };

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  await requireAdmin();
  const { greska } = await searchParams;

  return <ProductForm filters={await getFilters()} error={greska} />;
}
