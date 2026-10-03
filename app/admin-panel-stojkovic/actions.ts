"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isValidCode,
  normalizeCode,
  triggerLabels,
  type Discount,
  type DiscountTrigger,
} from "@/data/discounts";
import { builtInPages, isPageImageId, pageImageSlots } from "@/data/page-images";
import { FEATURED_COLLECTION_ID, type LowStockMode, type Product } from "@/data/products";
import {
  defaultSettings,
  fontOptions,
  isHexColor,
  type FontId,
  type ThemeColors,
} from "@/data/settings";
import {
  ADMIN_PATH,
  checkCredentials,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/admin-auth";
import {
  getCollections,
  getDiscounts,
  getFilters,
  getPageImages,
  getPages,
  getProducts,
  getSettings,
  removeUpload,
  saveUpload,
  updateContent,
} from "@/lib/content";
import {
  MAX_TEMPLATE_BYTES,
  removeCustomTemplate,
  saveCustomTemplate,
  sendTestEmail,
} from "@/lib/order-email";
import { setOrderStatus } from "@/lib/order-store";
import { orderStatusLabels, type OrderStatus } from "@/lib/orders";

/** Adrese koje stranica iz panela ne sme da zauzme: postojeće rute i ugrađene stranice. */
const RESERVED_PAGE_SLUGS = [
  "sirevi",
  "cesta-pitanja",
  "porudzbina",
  "kolekcije",
  "media",
  "slike",
  "nova",
  ADMIN_PATH.slice(1),
  ...builtInPages.map((page) => page.id),
];

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Prazno polje znači „još nije upisano" (null), kao u data/products.ts. */
function wholeNumber(formData: FormData, name: string): number | null {
  const value = Number(text(formData, name).replace(/\./g, ""));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

/** Broj komada iz forme: null kada je polje prazno, false kada nije ceo broj od nule naviše. */
function optionalCount(formData: FormData, name: string): number | null | false {
  const value = text(formData, name);
  if (value === "") return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : false;
}

function image(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug iz naziva koji nije zauzet; po potrebi dobija nastavak -2, -3… */
function uniqueSlug(name: string, taken: string[]): string {
  const base = slugify(name);
  if (!base) return "";
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

function backWithError(path: string, message: string): never {
  redirect(`${path}?greska=${encodeURIComponent(message)}`);
}

/** Stranice već otvorene u pregledaču vlasnika dobijaju svež sadržaj pri sledećem prelasku. */
function refreshSite() {
  revalidatePath("/", "layout");
}

/* ---------- Prijava ---------- */

export type LoginState = { error?: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!checkCredentials(text(formData, "username"), text(formData, "password"))) {
    // Usporava nagađanje lozinke.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Pogrešno korisničko ime ili lozinka." };
  }
  await createSession();
  redirect(ADMIN_PATH);
}

export async function logout() {
  await destroySession();
  redirect(ADMIN_PATH);
}

/* ---------- Proizvodi ---------- */

const PRODUCTS_PATH = `${ADMIN_PATH}/proizvodi`;

/** „Naslov: tekst" po redu → stavke sekcije „Uz šta ga služiti". */
function parseServing(value: string): Product["serving"] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(":");
      return colon === -1
        ? { title: line, text: "" }
        : {
            title: line.slice(0, colon).trim(),
            text: line.slice(colon + 1).trim(),
          };
    });
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

  const [products, filters] = await Promise.all([getProducts(), getFilters()]);
  const editedSlug = text(formData, "slug");
  const existing = products.find((product) => product.slug === editedSlug);
  const formPath = existing ? `${PRODUCTS_PATH}/${existing.slug}` : `${PRODUCTS_PATH}/novi`;
  if (editedSlug && !existing) backWithError(PRODUCTS_PATH, "Proizvod više ne postoji.");

  const name = text(formData, "name");
  if (!name) backWithError(formPath, "Upišite naziv proizvoda.");
  const fullName = text(formData, "fullName") || name;

  const filter = filters.find((candidate) => candidate.id === text(formData, "category"));
  if (!filter)
    backWithError(formPath, "Izaberite filter. Ako ga nema, prvo ga dodajte u delu Filteri.");

  // Slug se pravi jednom, pri dodavanju, i više se ne menja — da linkovi i korpe kupaca ostanu ispravni.
  const slug =
    existing?.slug ?? uniqueSlug(fullName, ["novi", ...products.map((product) => product.slug)]);
  if (!slug) backWithError(formPath, "Naziv mora da sadrži bar jedno slovo ili cifru.");

  // Akcija: prazno polje je gasi. Akcijska cena mora biti niža od redovne.
  const price = wholeNumber(formData, "price");
  const salePrice = wholeNumber(formData, "salePrice");
  if (salePrice !== null && (price === null || salePrice >= price)) {
    backWithError(formPath, "Cena na akciji mora biti niža od redovne cene.");
  }

  // Stanje: prazno polje za broj znači da se broj ne vodi i da važi ručno stanje.
  const stockQty = optionalCount(formData, "stockQty");
  if (stockQty === false)
    backWithError(formPath, "Broj komada na stanju je ceo broj, nula ili više.");
  const modeValue = text(formData, "lowStockMode");
  const lowStockMode: LowStockMode =
    modeValue === "always" || modeValue === "auto" ? modeValue : "off";
  const lowStockThreshold = optionalCount(formData, "lowStockThreshold");
  if (lowStockThreshold === false) backWithError(formPath, "Prag je ceo broj komada.");
  if (lowStockMode === "auto" && (stockQty === null || !lowStockThreshold)) {
    backWithError(
      formPath,
      "Da bi se oznaka „pri kraju“ prikazivala sama, upišite i broj komada na stanju i prag.",
    );
  }

  let imageSrc = existing?.image;
  const file = image(formData, "image");
  if (file) {
    const upload = await saveUpload(file, slug);
    if (!upload.ok) backWithError(formPath, upload.error);
    imageSrc = upload.src;
  }

  // Galerija: označene slike se uklanjaju, nove se dodaju na kraj.
  const removed = formData.getAll("galleryRemove").filter((value) => typeof value === "string");
  const gallery = (existing?.gallery ?? []).filter((src) => !removed.includes(src));
  const added: string[] = [];
  for (const value of formData.getAll("gallery")) {
    if (!(value instanceof File) || value.size === 0) continue;
    const upload = await saveUpload(value, slug);
    if (!upload.ok) {
      // Ništa se ne čuva napola: već primljene slike iz ovog slanja se brišu.
      for (const src of added) await removeUpload(src);
      backWithError(formPath, upload.error);
    }
    added.push(upload.src);
  }
  gallery.push(...added);

  const product: Product = {
    slug,
    name,
    fullName,
    category: filter.id,
    eyebrow: filter.eyebrow,
    tagline: text(formData, "tagline"),
    weight: wholeNumber(formData, "weight"),
    noWeight: formData.get("noWeight") === "on",
    price,
    salePrice,
    inStock: text(formData, "inStock") !== "no",
    stockQty,
    lowStockMode,
    lowStockThreshold,
    photo: existing?.photo ?? fullName.toLowerCase(),
    photoMain: existing?.photoMain ?? fullName.toLowerCase(),
    image: imageSrc,
    gallery,
    intro: text(formData, "intro"),
    description: text(formData, "description"),
    ingredients: text(formData, "ingredients"),
    serving: parseServing(text(formData, "serving")),
  };
  await updateContent((content) => {
    content.products = existing
      ? content.products.map((item) => (item.slug === slug ? product : item))
      : [...content.products, product];
  });
  if (file) await removeUpload(existing?.image);
  for (const src of existing?.gallery ?? []) {
    if (removed.includes(src)) await removeUpload(src);
  }

  refreshSite();
  redirect(PRODUCTS_PATH);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();

  const slug = text(formData, "slug");
  const product = (await getProducts()).find((candidate) => candidate.slug === slug);
  if (product) {
    await updateContent((content) => {
      content.products = content.products.filter((item) => item.slug !== slug);
      for (const collection of content.collections) {
        collection.productSlugs = collection.productSlugs.filter((item) => item !== slug);
      }
    });
    await removeUpload(product.image);
    for (const src of product.gallery ?? []) await removeUpload(src);
    refreshSite();
  }
  redirect(PRODUCTS_PATH);
}

/** Brza izmena stanja iz spiska proizvoda: klik menja ručno stanje, a broj se upisuje direktno. */
export async function setStockAction(formData: FormData) {
  await requireAdmin();

  const slug = text(formData, "slug");
  const stockQty = formData.has("stockQty") ? optionalCount(formData, "stockQty") : undefined;
  if (stockQty === false)
    backWithError(PRODUCTS_PATH, "Broj komada na stanju je ceo broj, nula ili više.");

  await updateContent((content) => {
    const product = content.products.find((item) => item.slug === slug);
    if (!product) return;
    if (stockQty === undefined) product.inStock = !(product.inStock ?? true);
    else product.stockQty = stockQty;
  });
  refreshSite();
  redirect(PRODUCTS_PATH);
}

/* ---------- Kolekcije ---------- */

const COLLECTIONS_PATH = `${ADMIN_PATH}/kolekcije`;

export async function createCollectionAction(formData: FormData) {
  await requireAdmin();

  const name = text(formData, "name");
  const id = uniqueSlug(
    name,
    (await getCollections()).map((collection) => collection.id),
  );
  if (!id) backWithError(COLLECTIONS_PATH, "Upišite naziv kolekcije.");

  await updateContent((content) => {
    content.collections.push({ id, name, description: "", productSlugs: [] });
  });
  refreshSite();
  redirect(`${COLLECTIONS_PATH}/${id}`);
}

export async function saveCollectionAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) backWithError(`${COLLECTIONS_PATH}/${id}`, "Upišite naziv kolekcije.");
  const chosen = formData.getAll("products").filter((value) => typeof value === "string");

  await updateContent((content) => {
    const collection = content.collections.find((candidate) => candidate.id === id);
    if (!collection) return;
    collection.name = name;
    collection.description = text(formData, "description");
    // Redosled u kolekciji prati redosled proizvoda u prodavnici.
    collection.productSlugs = content.products
      .map((product) => product.slug)
      .filter((slug) => chosen.includes(slug));
  });
  refreshSite();
  redirect(COLLECTIONS_PATH);
}

export async function deleteCollectionAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  if (id === FEATURED_COLLECTION_ID) {
    backWithError(COLLECTIONS_PATH, "Ova kolekcija puni početnu stranu i ne može da se obriše.");
  }
  await updateContent((content) => {
    content.collections = content.collections.filter((collection) => collection.id !== id);
  });
  refreshSite();
  redirect(COLLECTIONS_PATH);
}

/* ---------- Filteri ---------- */

const FILTERS_PATH = `${ADMIN_PATH}/filteri`;

export async function createFilterAction(formData: FormData) {
  await requireAdmin();

  const label = text(formData, "label");
  const id = uniqueSlug(
    label,
    (await getFilters()).map((filter) => filter.id),
  );
  if (!id) backWithError(FILTERS_PATH, "Upišite naziv filtera.");

  await updateContent((content) => {
    content.filters.push({
      id,
      label,
      eyebrow: text(formData, "eyebrow") || label,
    });
  });
  refreshSite();
  redirect(FILTERS_PATH);
}

export async function saveFilterAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  const label = text(formData, "label");
  if (!label) backWithError(FILTERS_PATH, "Naziv filtera ne može biti prazan.");

  await updateContent((content) => {
    const filter = content.filters.find((candidate) => candidate.id === id);
    if (!filter) return;
    filter.label = label;
    filter.eyebrow = text(formData, "eyebrow") || label;
  });
  refreshSite();
  redirect(FILTERS_PATH);
}

export async function deleteFilterAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  const used = (await getProducts()).filter((product) => product.category === id).length;
  if (used > 0) {
    backWithError(
      FILTERS_PATH,
      "Filter još koriste proizvodi. Prebacite ih u drugi filter pa ga onda obrišite.",
    );
  }
  await updateContent((content) => {
    content.filters = content.filters.filter((filter) => filter.id !== id);
  });
  refreshSite();
  redirect(FILTERS_PATH);
}

/* ---------- Popusti ---------- */

const DISCOUNTS_PATH = `${ADMIN_PATH}/popusti`;

export async function saveDiscountAction(formData: FormData) {
  await requireAdmin();

  const discounts = await getDiscounts();
  const editedId = text(formData, "id");
  const existing = discounts.find((discount) => discount.id === editedId);
  const formPath = existing ? `${DISCOUNTS_PATH}/${existing.id}` : `${DISCOUNTS_PATH}/novi`;
  if (editedId && !existing) backWithError(DISCOUNTS_PATH, "Popust više ne postoji.");

  const name = text(formData, "name");
  if (!name) backWithError(formPath, "Upišite naslov popusta.");
  // Kod je neobavezan: bez njega svaki kupac dobija svoj, nasumičan kod.
  const code = normalizeCode(text(formData, "code"));
  if (code !== "" && !isValidCode(code)) {
    backWithError(formPath, "Kod može imati 3–32 znaka: slova bez kvačica, cifre i crticu.");
  }
  if (code !== "" && discounts.some((item) => item.code === code && item.id !== existing?.id)) {
    backWithError(formPath, "Taj kod već koristi drugi popust. Svaki popust mora imati svoj kod.");
  }
  const percent = Number(text(formData, "percent"));
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    backWithError(formPath, "Popust je ceo broj od 1 do 100.");
  }
  const triggerValue = text(formData, "trigger");
  if (!(triggerValue in triggerLabels)) backWithError(formPath, "Izaberite kada se popust šalje.");
  const trigger = triggerValue as DiscountTrigger;
  // Prva porudžbina nema prag; iznos i težina ga moraju imati.
  const threshold = trigger === "first" ? 0 : Number(text(formData, "threshold"));
  if (!Number.isInteger(threshold) || (trigger !== "first" && threshold < 1)) {
    backWithError(
      formPath,
      trigger === "amount"
        ? "Upišite iznos u dinarima od kog se popust šalje."
        : "Upišite težinu u gramima od koje se popust šalje.",
    );
  }

  const discount: Discount = {
    id:
      existing?.id ??
      (uniqueSlug(name, ["novi", ...discounts.map((item) => item.id)]) ||
        `popust-${Date.now().toString(36)}`),
    name,
    code,
    percent,
    status: text(formData, "status") === "active" ? "active" : "draft",
    trigger,
    threshold,
  };
  await updateContent((content) => {
    content.discounts = existing
      ? content.discounts.map((item) => (item.id === discount.id ? discount : item))
      : [...content.discounts, discount];
  });
  redirect(DISCOUNTS_PATH);
}

/** Prebacuje popust između nacrta i aktivnog. */
export async function toggleDiscountAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  await updateContent((content) => {
    const discount = content.discounts.find((item) => item.id === id);
    if (discount) discount.status = discount.status === "active" ? "draft" : "active";
  });
  redirect(DISCOUNTS_PATH);
}

/** Briše pravilo. Kodovi koji su već poslati kupcima ostaju da važe. */
export async function deleteDiscountAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  await updateContent((content) => {
    content.discounts = content.discounts.filter((item) => item.id !== id);
  });
  redirect(DISCOUNTS_PATH);
}

/* ---------- Stranice ---------- */

const PAGES_PATH = `${ADMIN_PATH}/stranice`;

/** Zamena fotografije na ugrađenoj stranici (Početna, O nama, Stranica proizvoda). */
export async function replacePageImageAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  if (!isPageImageId(id)) backWithError(ADMIN_PATH, "Nepoznato mesto za sliku.");
  const pagePath = `${PAGES_PATH}/${pageImageSlots.find((slot) => slot.id === id)!.pageId}`;
  const file = image(formData, "image");
  if (!file) backWithError(pagePath, "Izaberite sliku pre slanja.");

  const previous = (await getPageImages())[id];
  const upload = await saveUpload(file, id);
  if (!upload.ok) backWithError(pagePath, upload.error);
  await updateContent((content) => {
    content.pageImages[id] = upload.src;
  });
  await removeUpload(previous);

  refreshSite();
  redirect(pagePath);
}

export async function savePageAction(formData: FormData) {
  await requireAdmin();

  const pages = await getPages();
  const editedSlug = text(formData, "slug");
  const existing = pages.find((page) => page.slug === editedSlug);
  const formPath = existing ? `${PAGES_PATH}/${existing.slug}` : `${PAGES_PATH}/nova`;
  if (editedSlug && !existing) backWithError(ADMIN_PATH, "Stranica više ne postoji.");

  const title = text(formData, "title");
  if (!title) backWithError(formPath, "Upišite naslov stranice.");

  // Adresa se pravi jednom, iz naslova, i više se ne menja.
  const slug =
    existing?.slug ??
    uniqueSlug(title, [...RESERVED_PAGE_SLUGS, ...pages.map((page) => page.slug)]);
  if (!slug) backWithError(formPath, "Naslov mora da sadrži bar jedno slovo ili cifru.");

  const fields = {
    title,
    body: text(formData, "body"),
    showInFooter: formData.get("showInFooter") === "on",
  };
  await updateContent((content) => {
    const page = content.pages.find((candidate) => candidate.slug === slug);
    if (page) Object.assign(page, fields);
    else content.pages.push({ slug, ...fields, images: [] });
  });

  refreshSite();
  redirect(`${PAGES_PATH}/${slug}`);
}

export async function deletePageAction(formData: FormData) {
  await requireAdmin();

  const slug = text(formData, "slug");
  const page = (await getPages()).find((candidate) => candidate.slug === slug);
  if (page) {
    await updateContent((content) => {
      content.pages = content.pages.filter((candidate) => candidate.slug !== slug);
    });
    for (const item of page.images) await removeUpload(item.src);
    refreshSite();
  }
  redirect(ADMIN_PATH);
}

/** Dodaje fotografiju stranici iz panela ili, kada stigne `imageId`, menja postojeću. */
export async function savePageImageAction(formData: FormData) {
  await requireAdmin();

  const slug = text(formData, "slug");
  const page = (await getPages()).find((candidate) => candidate.slug === slug);
  if (!page) backWithError(ADMIN_PATH, "Stranica više ne postoji.");
  const pagePath = `${PAGES_PATH}/${slug}`;

  const imageId = text(formData, "imageId");
  const existing = page.images.find((item) => item.id === imageId);
  const file = image(formData, "image");
  if (!file) backWithError(pagePath, "Izaberite sliku pre slanja.");

  const upload = await saveUpload(file, slug);
  if (!upload.ok) backWithError(pagePath, upload.error);
  await updateContent((content) => {
    const target = content.pages.find((candidate) => candidate.slug === slug);
    if (!target) return;
    const item = target.images.find((candidate) => candidate.id === imageId);
    if (item) item.src = upload.src;
    else
      target.images.push({
        id: Date.now().toString(36),
        src: upload.src,
        alt: text(formData, "alt"),
      });
  });
  await removeUpload(existing?.src);

  refreshSite();
  redirect(pagePath);
}

export async function deletePageImageAction(formData: FormData) {
  await requireAdmin();

  const slug = text(formData, "slug");
  const imageId = text(formData, "imageId");
  const page = (await getPages()).find((candidate) => candidate.slug === slug);
  const item = page?.images.find((candidate) => candidate.id === imageId);
  if (item) {
    await updateContent((content) => {
      const target = content.pages.find((candidate) => candidate.slug === slug);
      if (target) target.images = target.images.filter((candidate) => candidate.id !== imageId);
    });
    await removeUpload(item.src);
    refreshSite();
  }
  redirect(`${PAGES_PATH}/${slug}`);
}

/* ---------- Porudžbine ---------- */

export async function setOrderStatusAction(formData: FormData) {
  await requireAdmin();

  const status = text(formData, "status");
  if (status in orderStatusLabels) {
    await setOrderStatus(text(formData, "number"), status as OrderStatus);
  }
  redirect(`${ADMIN_PATH}/porudzbine`);
}

/* ---------- Podešavanja ---------- */

const SETTINGS_PATH = `${ADMIN_PATH}/podesavanja`;

function backWithNotice(message: string): never {
  redirect(`${SETTINGS_PATH}?ok=${encodeURIComponent(message)}`);
}

function fontId(formData: FormData, name: string, fallback: FontId): FontId {
  const value = text(formData, name);
  return fontOptions.find((option) => option.id === value)?.id ?? fallback;
}

export async function saveAppearanceAction(formData: FormData) {
  await requireAdmin();
  const current = await getSettings();

  const colors = { ...current.colors };
  for (const key of Object.keys(colors) as (keyof ThemeColors)[]) {
    const value = text(formData, key);
    // Boje idu pravo u CSS sajta, pa prolazi samo oblik #rrggbb.
    if (!isHexColor(value)) backWithError(SETTINGS_PATH, "Boja mora biti u obliku #rrggbb.");
    colors[key] = value.toLowerCase();
  }

  // Slike: nova zamenjuje staru; „Ukloni" vraća podrazumevani izgled.
  const images = { logo: current.logo, favicon: current.favicon };
  const replaced: (string | undefined)[] = [];
  for (const key of ["logo", "favicon"] as const) {
    const file = image(formData, key);
    if (file) {
      const upload = await saveUpload(file, key);
      if (!upload.ok) backWithError(SETTINGS_PATH, upload.error);
      replaced.push(images[key]);
      images[key] = upload.src;
    } else if (formData.get(`${key}Remove`) === "on") {
      replaced.push(images[key]);
      images[key] = undefined;
    }
  }

  await updateContent((content) => {
    content.settings = {
      ...content.settings,
      colors,
      headingFont: fontId(formData, "headingFont", current.headingFont),
      bodyFont: fontId(formData, "bodyFont", current.bodyFont),
      ...images,
    };
  });
  for (const src of replaced) await removeUpload(src);

  refreshSite();
  backWithNotice("Izgled je sačuvan.");
}

export async function resetAppearanceAction() {
  await requireAdmin();

  await updateContent((content) => {
    content.settings.colors = defaultSettings.colors;
    content.settings.headingFont = defaultSettings.headingFont;
    content.settings.bodyFont = defaultSettings.bodyFont;
  });
  refreshSite();
  backWithNotice("Vraćene su boje i fontovi iz dizajna.");
}

export async function saveShippingAction(formData: FormData) {
  await requireAdmin();

  const freeFrom = Number(text(formData, "freeFrom"));
  if (!Number.isInteger(freeFrom) || freeFrom < 1) {
    backWithError(SETTINGS_PATH, "Iznos za besplatnu dostavu je ceo broj dinara, veći od nule.");
  }
  const freeEnabled = formData.get("freeEnabled") === "on";
  await updateContent((content) => {
    content.settings.shipping = { freeEnabled, freeFrom };
  });
  refreshSite();
  backWithNotice(
    freeEnabled
      ? "Besplatna dostava je uključena."
      : "Besplatna dostava je isključena; iznos je sačuvan.",
  );
}

function emailAddress(formData: FormData, name: string, label: string): string {
  const value = text(formData, name);
  if (value !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    backWithError(SETTINGS_PATH, `Proverite adresu u polju „${label}".`);
  }
  return value;
}

export async function saveMailAction(formData: FormData) {
  await requireAdmin();

  const sellerEmail = emailAddress(formData, "sellerEmail", "Vaš email");
  const fromEmail = emailAddress(formData, "fromEmail", "Adresa pošiljaoca");
  const port = Number(text(formData, "smtpPort"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    backWithError(SETTINGS_PATH, "Port je broj, najčešće 587 ili 465.");
  }
  const password = formData.get("smtpPassword");

  await updateContent((content) => {
    const { mail } = content.settings;
    content.settings.mail = {
      ...mail,
      notifySeller: formData.get("notifySeller") === "on",
      notifyCustomer: formData.get("notifyCustomer") === "on",
      sellerEmail,
      fromName: text(formData, "fromName"),
      fromEmail,
      smtpHost: text(formData, "smtpHost"),
      smtpPort: port,
      smtpUser: text(formData, "smtpUser"),
      // Lozinka se ne prikazuje u formi; prazno polje znači „ostaje ista".
      smtpPassword: typeof password === "string" && password !== "" ? password : mail.smtpPassword,
    };
  });
  backWithNotice("Podešavanja emaila su sačuvana.");
}

export async function uploadTemplateAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get("template");
  if (!(file instanceof File) || file.size === 0) {
    backWithError(SETTINGS_PATH, "Izaberite HTML fajl sa šablonom.");
  }
  if (file.size > MAX_TEMPLATE_BYTES) backWithError(SETTINGS_PATH, "Šablon je veći od 300 KB.");
  const html = await file.text();
  if (!html.includes("<") || !html.includes("{{")) {
    backWithError(
      SETTINGS_PATH,
      "Fajl ne liči na šablon: treba da bude HTML sa mestima poput {{stavke}} i {{ukupno}}.",
    );
  }

  await saveCustomTemplate(html);
  await updateContent((content) => {
    content.settings.mail.customTemplate = true;
  });
  backWithNotice("Vaš šablon je ubačen. Pogledajte pregled pre nego što stigne prva porudžbina.");
}

export async function resetTemplateAction() {
  await requireAdmin();

  await updateContent((content) => {
    content.settings.mail.customTemplate = false;
  });
  await removeCustomTemplate();
  backWithNotice("Koristi se naš šablon.");
}

export async function sendTestEmailAction() {
  await requireAdmin();

  const error = await sendTestEmail();
  if (error) backWithError(SETTINGS_PATH, `Probni email nije poslat — ${error}`);
  backWithNotice(
    "Probni email je poslat na vašu adresu: jedna poruka kakvu dobijate vi, jedna kakvu dobija kupac.",
  );
}
