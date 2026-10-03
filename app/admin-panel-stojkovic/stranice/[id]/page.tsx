import Link from "next/link";
import { notFound } from "next/navigation";
import { builtInPages, pageImageSlots } from "@/data/page-images";
import { requireAdmin } from "@/lib/admin-auth";
import { getPageImages, getPages } from "@/lib/content";
import {
  deletePageAction,
  deletePageImageAction,
  replacePageImageAction,
  savePageImageAction,
} from "../../actions";
import { ConfirmButton } from "../../confirm-button";
import {
  buttonClass,
  cardClass,
  fileClass,
  IMAGE_ACCEPT,
  IMAGE_HINT,
  inputClass,
  labelClass,
  PageHeader,
  quietButtonClass,
  rowClass,
  Thumb,
} from "../../ui";
import { PageForm } from "../page-form";

type AdminPagePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ greska?: string }>;
};

const sectionTitle = "mb-[4px] text-[17px]";
const siteLink = "inline-flex min-h-[44px] items-center text-[14px] underline";

export default async function AdminPagePage({ params, searchParams }: AdminPagePageProps) {
  await requireAdmin();
  const [{ id }, { greska }] = await Promise.all([params, searchParams]);

  // Ugrađena stranica: tekst je u kodu, ovde se menjaju samo njene fotografije.
  const builtIn = builtInPages.find((page) => page.id === id);
  if (builtIn) {
    const images = await getPageImages();
    return (
      <>
        <PageHeader
          title={builtIn.title}
          hint={
            builtIn.id === "proizvod"
              ? "Tri male fotografije u galeriji, iste na stranici svakog proizvoda. Glavna slika proizvoda menja se u delu Proizvodi."
              : `Fotografije na ovoj stranici. Izaberite novu sliku i kliknite „Zameni“. ${IMAGE_HINT}.`
          }
          error={greska}
          action={
            builtIn.href && (
              <Link href={builtIn.href} target="_blank" className={siteLink}>
                Otvori stranicu ↗
              </Link>
            )
          }
        />
        <div className={cardClass}>
          {pageImageSlots
            .filter((slot) => slot.pageId === builtIn.id)
            .map((slot) => (
              <form key={slot.id} action={replacePageImageAction} className={rowClass}>
                <input type="hidden" name="id" value={slot.id} />
                <Thumb src={images[slot.id]} alt={slot.label} />
                <div className="min-w-[180px] grow text-[16px]">{slot.label}</div>
                <input
                  type="file"
                  name="image"
                  accept={IMAGE_ACCEPT}
                  required
                  aria-label={`Nova slika: ${slot.label}`}
                  className={fileClass}
                />
                <button type="submit" className={quietButtonClass}>
                  Zameni
                </button>
              </form>
            ))}
        </div>
      </>
    );
  }

  const page = (await getPages()).find((candidate) => candidate.slug === id);
  if (!page) notFound();

  return (
    <>
      <PageHeader
        title={page.title}
        hint={`Adresa na sajtu: /${page.slug}`}
        error={greska}
        action={
          <Link href={`/${page.slug}`} target="_blank" className={siteLink}>
            Otvori stranicu ↗
          </Link>
        }
      />

      <div className={`${cardClass} mb-[16px] max-w-[680px]`}>
        <h2 className={sectionTitle}>Fotografije</h2>
        <p className="mb-[8px] text-[14px] text-muted">
          Prikazuju se ispod teksta, redom kojim su dodate. {IMAGE_HINT}.
        </p>
        {page.images.map((image) => (
          <div key={image.id} className={rowClass}>
            <Thumb src={image.src} alt={image.alt} />
            <form
              action={savePageImageAction}
              className="flex grow flex-wrap items-center gap-[12px]"
            >
              <input type="hidden" name="slug" value={page.slug} />
              <input type="hidden" name="imageId" value={image.id} />
              <div className="min-w-[120px] grow text-[15px]">{image.alt || "bez opisa"}</div>
              <input
                type="file"
                name="image"
                accept={IMAGE_ACCEPT}
                required
                aria-label={`Nova slika: ${image.alt || page.title}`}
                className={fileClass}
              />
              <button type="submit" className={quietButtonClass}>
                Zameni
              </button>
            </form>
            <form action={deletePageImageAction}>
              <input type="hidden" name="slug" value={page.slug} />
              <input type="hidden" name="imageId" value={image.id} />
              <ConfirmButton
                question="Ukloniti ovu fotografiju sa stranice?"
                className={quietButtonClass}
              >
                Ukloni
              </ConfirmButton>
            </form>
          </div>
        ))}
        {page.images.length === 0 && (
          <p className="py-[8px] text-[15px] text-muted">Stranica još nema fotografija.</p>
        )}

        <form
          action={savePageImageAction}
          className="mt-[8px] flex flex-wrap items-end gap-[12px] border-t border-line pt-[16px]"
        >
          <input type="hidden" name="slug" value={page.slug} />
          <label className={`${labelClass} min-w-[200px] grow`}>
            Opis nove fotografije (šta je na njoj)
            <input name="alt" className={inputClass} />
          </label>
          <input
            type="file"
            name="image"
            accept={IMAGE_ACCEPT}
            required
            aria-label="Nova fotografija"
            className={`${fileClass} min-h-[44px]`}
          />
          <button type="submit" className={buttonClass}>
            Dodaj fotografiju
          </button>
        </form>
      </div>

      <PageForm page={page} />

      <form action={deletePageAction} className="mt-[24px]">
        <input type="hidden" name="slug" value={page.slug} />
        <ConfirmButton
          question={`Obrisati stranicu „${page.title}" i njene fotografije?`}
          className={quietButtonClass}
        >
          Obriši stranicu
        </ConfirmButton>
      </form>
    </>
  );
}
