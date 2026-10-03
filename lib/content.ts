import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import {
  pageImageSlots,
  type CustomPage,
  type PageImageId,
  type PageImages,
} from "@/data/page-images";
import {
  defaultFilters,
  FEATURED_COLLECTION_ID,
  products as seedProducts,
  type Collection,
  type Filter,
  type Product,
} from "@/data/products";
import { defaultSettings, type Settings } from "@/data/settings";

/**
 * Sadržaj koji se menja iz admin panela: proizvodi, filteri, kolekcije,
 * stranice, fotografije i opšta podešavanja. Porudžbine su odvojeno, u lib/order-store.ts.
 *
 * Bez baze: sve je u folderu `storage/` — `content.json` i `uploads/`. Folder
 * nije u git-u, pa ga deploy ne dira. Dok `content.json` ne postoji, sajt
 * prikazuje početne proizvode iz data/products.ts i slike iz public/slike.
 *
 * Samo za server (čita disk) — ne uvoziti u "use client" komponente.
 */

export const STORAGE_DIR = path.join(process.cwd(), "storage");
const CONTENT_FILE = path.join(STORAGE_DIR, "content.json");
export const UPLOADS_DIR = path.join(STORAGE_DIR, "uploads");

/** Javna putanja pod kojom app/media/[file]/route.ts služi ubačene slike. */
const MEDIA_PREFIX = "/media/";
export const MEDIA_FILE_PATTERN = /^[a-z0-9-]+\.(jpg|png|webp)$/;

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

type Content = {
  products: Product[];
  pageImages: Partial<Record<PageImageId, string>>;
  filters: Filter[];
  collections: Collection[];
  pages: CustomPage[];
  settings: Settings;
};

/** Ono čega u fajlu još nema popunjava se početnim vrednostima iz data/. */
function withDefaults(saved: Partial<Content>): Content {
  const products = saved.products ?? seedProducts;
  return {
    products,
    pageImages: saved.pageImages ?? {},
    filters: saved.filters ?? defaultFilters,
    collections: saved.collections ?? [
      {
        id: FEATURED_COLLECTION_ID,
        name: "Izdvojeni sirevi",
        description: "",
        productSlugs: products.slice(0, 4).map((product) => product.slug),
      },
    ],
    pages: saved.pages ?? [],
    // Spajanje sa početnim vrednostima, da podešavanje dodato kasnije ne fali u starom fajlu.
    settings: {
      ...defaultSettings,
      ...saved.settings,
      colors: { ...defaultSettings.colors, ...saved.settings?.colors },
      mail: { ...defaultSettings.mail, ...saved.settings?.mail },
    },
  };
}

async function readFromDisk(): Promise<Content> {
  try {
    return withDefaults(JSON.parse(await readFile(CONTENT_FILE, "utf8")) as Partial<Content>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return withDefaults({});
    throw error;
  }
}

const readContent = cache(readFromDisk);

let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * Jedini put za izmene: čita fajl iznova, primeni `change` i upiše ceo sadržaj.
 * Izmene idu jedna po jedna, a upis preko privremenog fajla, da prekid usred
 * upisa ne ostavi pola JSON-a.
 */
export function updateContent(change: (content: Content) => void): Promise<void> {
  const run = writeQueue.then(async () => {
    // Kopija, da izmena ne dira početne vrednosti iz data/ koje dele svi zahtevi.
    const content = structuredClone(await readFromDisk());
    change(content);
    await mkdir(STORAGE_DIR, { recursive: true });
    const temp = `${CONTENT_FILE}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(content, null, 2), "utf8");
    await rename(temp, CONTENT_FILE);
  });
  writeQueue = run.catch(() => {});
  return run;
}

export async function getProducts(): Promise<Product[]> {
  return (await readContent()).products;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((product) => product.slug === slug);
}

export async function getFilters(): Promise<Filter[]> {
  return (await readContent()).filters;
}

export async function getCollections(): Promise<Collection[]> {
  return (await readContent()).collections;
}

export async function getPages(): Promise<CustomPage[]> {
  return (await readContent()).pages;
}

/** Sadrži i lozinku za SMTP — ne prosleđivati ceo objekat u "use client" komponente. */
export async function getSettings(): Promise<Settings> {
  return (await readContent()).settings;
}

export async function getPageImages(): Promise<PageImages> {
  const saved = (await readContent()).pageImages;
  return Object.fromEntries(
    pageImageSlots.map((slot) => [slot.id, saved[slot.id] ?? slot.fallback]),
  ) as PageImages;
}

/** Tip se čita iz početnih bajtova fajla, ne iz imena ni iz onoga što javi pregledač. */
function detectExtension(bytes: Buffer): "jpg" | "png" | "webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export type UploadResult = { ok: true; src: string } | { ok: false; error: string };

/**
 * Čuva ubačenu sliku u storage/uploads i vraća njenu javnu putanju.
 * Svaka slika dobija novo ime, pa pregledač i next/image nikad ne prikažu staru iz keša.
 */
export async function saveUpload(file: File, name: string): Promise<UploadResult> {
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Slika je veća od 15 MB. Smanjite je pa pokušajte ponovo.",
    };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = detectExtension(bytes);
  if (!extension) {
    return { ok: false, error: "Slika mora biti JPG, PNG ili WebP." };
  }

  const fileName = `${name}-${Date.now().toString(36)}.${extension}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, fileName), bytes);
  return { ok: true, src: `${MEDIA_PREFIX}${fileName}` };
}

/** Putanja na disku do ubačene slike, ili null ako `src` nije iz storage/uploads. */
export function uploadPath(src: string | undefined): string | null {
  if (!src?.startsWith(MEDIA_PREFIX)) return null;
  const fileName = src.slice(MEDIA_PREFIX.length);
  return MEDIA_FILE_PATTERN.test(fileName) ? path.join(UPLOADS_DIR, fileName) : null;
}

/** Briše ubačenu sliku koja se više ne koristi. Slike iz public/slike se ne diraju. */
export async function removeUpload(src: string | undefined) {
  const file = uploadPath(src);
  if (file) await unlink(file).catch(() => {});
}
