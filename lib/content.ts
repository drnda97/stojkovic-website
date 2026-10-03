import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { cache } from "react";
import {
  pageImageSlots,
  type CustomPage,
  type PageImageId,
  type PageImages,
} from "@/data/page-images";
import type { Discount } from "@/data/discounts";
import type { Collection, Filter, Product } from "@/data/products";
import { defaultSettings, type Settings } from "@/data/settings";
import { getDb, insertProducts } from "@/lib/db";

/**
 * Sadržaj koji se menja iz admin panela: proizvodi, filteri, kolekcije,
 * stranice, fotografije i opšta podešavanja. Porudžbine su odvojeno, u lib/order-store.ts.
 *
 * Sve je u MySQL bazi (tabele: lib/db.ts). Na disku su samo fajlovi ubačenih
 * slika, u `storage/uploads/`; u bazi je njihova putanja.
 *
 * Samo za server — ne uvoziti u "use client" komponente.
 */

/** Folder sa ubačenim slikama. UPLOADS_DIR ga premešta, npr. na hostingu ili u testovima. */
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "storage", "uploads");

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
  discounts: Discount[];
  settings: Settings;
};

/** Tabele koje zajedno čine sadržaj; `settings` se čuva posebno, kao jedan red. */
const CONTENT_TABLES = [
  "products",
  "product_images",
  "filters",
  "collections",
  "collection_products",
  "pages",
  "page_images",
  "site_images",
  "discounts",
];

async function loadContent(db: Pool | PoolConnection): Promise<Content> {
  const select = async (sql: string) => (await db.query<RowDataPacket[]>(sql))[0];
  // Jedan po jedan upit: ista veza (u transakciji) ne može da vodi više upita odjednom.
  const products = await select("SELECT * FROM products ORDER BY position");
  const productImages = await select("SELECT * FROM product_images ORDER BY position");
  const filters = await select("SELECT * FROM filters ORDER BY position");
  const collections = await select("SELECT * FROM collections ORDER BY position");
  const collectionProducts = await select("SELECT * FROM collection_products ORDER BY position");
  const pages = await select("SELECT * FROM pages ORDER BY position");
  const pageImages = await select("SELECT * FROM page_images ORDER BY position");
  const siteImages = await select("SELECT * FROM site_images");
  const discounts = await select("SELECT * FROM discounts ORDER BY position");
  const settings = await select("SELECT value FROM settings WHERE name = 'settings'");
  const saved = settings.length > 0 ? (JSON.parse(settings[0].value) as Partial<Settings>) : {};

  return {
    products: products.map((row) => ({
      slug: row.slug,
      name: row.name,
      fullName: row.full_name,
      category: row.category,
      eyebrow: row.eyebrow,
      tagline: row.tagline,
      weight: row.weight,
      ...(row.no_weight === null ? {} : { noWeight: row.no_weight === 1 }),
      price: row.price,
      salePrice: row.sale_price,
      inStock: row.in_stock === 1,
      stockQty: row.stock_qty,
      lowStockMode: row.low_stock_mode,
      lowStockThreshold: row.low_stock_threshold,
      photo: row.photo,
      photoMain: row.photo_main,
      ...(row.image === null ? {} : { image: row.image }),
      gallery: productImages
        .filter((image) => image.product_slug === row.slug)
        .map((image) => image.src),
      intro: row.intro,
      description: row.description,
      ingredients: row.ingredients,
      serving: JSON.parse(row.serving),
    })),
    filters: filters.map((row) => ({ id: row.id, label: row.label, eyebrow: row.eyebrow })),
    collections: collections.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      productSlugs: collectionProducts
        .filter((item) => item.collection_id === row.id)
        .map((item) => item.product_slug),
    })),
    pages: pages.map((row) => ({
      slug: row.slug,
      title: row.title,
      body: row.body,
      showInFooter: row.show_in_footer === 1,
      images: pageImages
        .filter((image) => image.page_slug === row.slug)
        .map((image) => ({ id: image.id, src: image.src, alt: image.alt })),
    })),
    pageImages: Object.fromEntries(siteImages.map((row) => [row.slot_id, row.src])),
    discounts: discounts.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      percent: row.percent,
      status: row.status,
      trigger: row.trigger_type,
      threshold: row.threshold,
    })),
    // Spajanje sa početnim vrednostima, da podešavanje dodato kasnije ne fali u starom zapisu.
    settings: {
      ...defaultSettings,
      ...saved,
      colors: { ...defaultSettings.colors, ...saved.colors },
      shipping: { ...defaultSettings.shipping, ...saved.shipping },
      mail: { ...defaultSettings.mail, ...saved.mail },
    },
  };
}

async function insertRows(connection: PoolConnection, sql: string, rows: unknown[][]) {
  if (rows.length > 0) await connection.query(sql, [rows]);
}

async function storeContent(connection: PoolConnection, content: Content) {
  for (const table of CONTENT_TABLES) await connection.query(`DELETE FROM ${table}`);

  await insertProducts(connection, content.products);
  await insertRows(
    connection,
    "INSERT INTO product_images (product_slug, position, src) VALUES ?",
    content.products.flatMap((product) =>
      (product.gallery ?? []).map((src, index) => [product.slug, index, src]),
    ),
  );
  await insertRows(
    connection,
    "INSERT INTO filters (id, position, label, eyebrow) VALUES ?",
    content.filters.map((filter, index) => [filter.id, index, filter.label, filter.eyebrow]),
  );
  await insertRows(
    connection,
    "INSERT INTO collections (id, position, name, description) VALUES ?",
    content.collections.map((item, index) => [item.id, index, item.name, item.description]),
  );
  await insertRows(
    connection,
    "INSERT INTO collection_products (collection_id, product_slug, position) VALUES ?",
    content.collections.flatMap((item) =>
      [...new Set(item.productSlugs)].map((slug, index) => [item.id, slug, index]),
    ),
  );
  await insertRows(
    connection,
    "INSERT INTO pages (slug, position, title, body, show_in_footer) VALUES ?",
    content.pages.map((page, index) => [
      page.slug,
      index,
      page.title,
      page.body,
      page.showInFooter,
    ]),
  );
  await insertRows(
    connection,
    "INSERT INTO page_images (page_slug, id, position, src, alt) VALUES ?",
    content.pages.flatMap((page) =>
      page.images.map((image, index) => [page.slug, image.id, index, image.src, image.alt]),
    ),
  );
  await insertRows(
    connection,
    "INSERT INTO site_images (slot_id, src) VALUES ?",
    Object.entries(content.pageImages).filter(([, src]) => src),
  );
  await insertRows(
    connection,
    "INSERT INTO discounts (id, position, name, code, percent, status, trigger_type, threshold) VALUES ?",
    content.discounts.map((discount, index) => [
      discount.id,
      index,
      discount.name,
      discount.code,
      discount.percent,
      discount.status,
      discount.trigger,
      discount.threshold,
    ]),
  );
  await connection.query(
    "INSERT INTO settings (name, value) VALUES ('settings', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
    [JSON.stringify(content.settings)],
  );
}

const readContent = cache(async () => loadContent(await getDb()));

const LOCK_NAME = "stojkovic_content";

/**
 * Izvršava `run` u transakciji, pod zaključavanjem po imenu: izmene sadržaja i
 * upisi porudžbina (koji skidaju sa stanja) idu jedna po jedna, i kada sajt
 * radi u više procesa. Sve se sačuva celo ili nikako.
 */
export async function withContentLock<T>(
  run: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await (await getDb()).getConnection();
  try {
    const [lock] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK(?, 10) AS locked", [
      LOCK_NAME,
    ]);
    if (lock[0].locked !== 1) throw new Error("Druga izmena je u toku. Pokušajte ponovo.");
    try {
      await connection.beginTransaction();
      const result = await run(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
    }
  } finally {
    connection.release();
  }
}

/**
 * Jedini put za izmene sadržaja iz panela: učita ga iz baze, primeni `change`
 * i upiše nazad. Sadržaja je malo (desetine redova), pa se tabele prepisuju cele.
 */
export async function updateContent(change: (content: Content) => void): Promise<void> {
  await withContentLock(async (connection) => {
    const content = await loadContent(connection);
    change(content);
    await storeContent(connection, content);
  });
}

/** Pojedinačan zapis iz tabele settings (npr. sopstveni šablon emaila); null ako ga nema. */
export async function getStoredValue(name: string): Promise<string | null> {
  const [rows] = await (
    await getDb()
  ).query<RowDataPacket[]>("SELECT value FROM settings WHERE name = ?", [name]);
  return rows.length > 0 ? rows[0].value : null;
}

/** Upisuje zapis u tabelu settings; `null` ga briše. */
export async function setStoredValue(name: string, value: string | null) {
  const db = await getDb();
  if (value === null) {
    await db.query("DELETE FROM settings WHERE name = ?", [name]);
  } else {
    await db.query(
      "INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      [name, value],
    );
  }
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

export async function getDiscounts(): Promise<Discount[]> {
  return (await readContent()).discounts;
}

/** Vrednost od koje je dostava besplatna, ili null kada je besplatna dostava isključena. */
export async function getFreeShippingFrom(): Promise<number | null> {
  const { shipping } = await getSettings();
  return shipping.freeEnabled ? shipping.freeFrom : null;
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

  // Vreme i nasumičan dodatak: više slika ubačenih u istom trenutku ne dobija isto ime.
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const fileName = `${name}-${unique}.${extension}`;
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
