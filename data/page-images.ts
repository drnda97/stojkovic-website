/**
 * Fotografije ugrađenih stranica koje nisu vezane za proizvod.
 *
 * `fallback` je slika iz /public koja se prikazuje dok se iz admin panela ne
 * ubaci nova. Novo mesto za sliku dodaje se ovde, a zatim se na stranici čita
 * preko `getPageImages()` iz lib/content.ts.
 */
/** Stranice koje postoje u kodu. Stranice napravljene u admin panelu su u bazi. */
export const builtInPages = [
  { id: "pocetna", title: "Početna", href: "/" },
  { id: "o-nama", title: "O nama", href: "/o-nama" },
  { id: "proizvod", title: "Stranica proizvoda", href: null },
] as const;

export const pageImageSlots = [
  {
    id: "pocetna-sir",
    pageId: "pocetna",
    label: "Glavna fotografija na vrhu",
    fallback: "/slike/pocetna-sir.jpg",
  },
  {
    id: "koze-na-ispasi",
    pageId: "pocetna",
    label: "Naša priča",
    fallback: "/slike/koze-na-ispasi.jpg",
  },
  {
    id: "imanje-i-stado",
    pageId: "o-nama",
    label: "Široka fotografija imanja",
    fallback: "/slike/imanje-i-stado.jpg",
  },
  {
    id: "ruke-u-sirani",
    pageId: "o-nama",
    label: "Kako nastaje",
    fallback: "/slike/ruke-u-sirani.jpg",
  },
  {
    id: "galerija-odozgo",
    pageId: "proizvod",
    label: "Galerija · Odozgo",
    fallback: "/slike/galerija-odozgo.jpg",
  },
  {
    id: "galerija-pakovanje",
    pageId: "proizvod",
    label: "Galerija · Pakovanje",
    fallback: "/slike/galerija-pakovanje.jpg",
  },
  {
    id: "galerija-na-tanjiru",
    pageId: "proizvod",
    label: "Galerija · Na tanjiru",
    fallback: "/slike/galerija-na-tanjiru.jpg",
  },
] as const;

export type PageImageId = (typeof pageImageSlots)[number]["id"];
export type PageImages = Record<PageImageId, string>;

export function isPageImageId(value: string): value is PageImageId {
  return pageImageSlots.some((slot) => slot.id === value);
}

/** Stranica napravljena u admin panelu: naslov, tekst i fotografije; javna adresa je /{slug}. */
export type CustomPage = {
  slug: string;
  title: string;
  /** Običan tekst; prazan red razdvaja pasuse. */
  body: string;
  showInFooter: boolean;
  images: { id: string; src: string; alt: string }[];
};
