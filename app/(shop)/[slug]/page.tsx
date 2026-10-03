import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Placeholder } from "@/components/placeholder";
import { getPages } from "@/lib/content";

type CustomPageProps = { params: Promise<{ slug: string }> };

async function findPage(slug: string) {
  return (await getPages()).find((page) => page.slug === slug);
}

function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: CustomPageProps): Promise<Metadata> {
  const page = await findPage((await params).slug);
  if (!page) return {};
  return { title: page.title, description: paragraphs(page.body)[0]?.slice(0, 160) };
}

export default async function CustomPage({ params }: CustomPageProps) {
  const page = await findPage((await params).slug);
  if (!page) notFound();

  return (
    <section className="mx-auto box-content max-w-site px-[16px] md:px-[32px] pt-[72px] pb-[96px]">
      <h1 className="max-w-[14em] text-[length:clamp(44px,5.5vw,72px)] leading-[1.05] text-balance">
        {page.title}
      </h1>
      <div className="mt-[32px] flex max-w-[640px] flex-col gap-[20px] whitespace-pre-line text-muted">
        {paragraphs(page.body).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {page.images.length > 0 && (
        <div className="mt-[64px] grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[24px]">
          {page.images.map((image) => (
            <Placeholder
              key={image.id}
              label={image.alt || page.title}
              src={image.src}
              sizes="(min-width: 900px) 50vw, 100vw"
              className="aspect-[4/5]"
            />
          ))}
        </div>
      )}
    </section>
  );
}
