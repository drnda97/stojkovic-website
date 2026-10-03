/**
 * Početni proizvodi. Važe dok se iz admin panela ne sačuva prva izmena; od
 * tada se proizvodi čitaju iz storage/content.json (vidi lib/content.ts).
 *
 * Cena (`price`, u RSD) i gramaža (`weight`, u gramima) su `null` dok ih vlasnik
 * ne dostavi; sajt tada prikazuje „[CENA] RSD" i „[GRAMAŽA] g". Kada se upišu
 * brojevi, cene, međuzbir i ukupan iznos se računaju sami.
 */

export type Product = {
  slug: string;
  /** Naziv na kartici i u putanji (breadcrumb). */
  name: string;
  /** Pun naziv: naslov stranice proizvoda, korpa, porudžbina. */
  fullName: string;
  /** Id filtera (vidi `defaultFilters`); po njemu se proizvod filtrira na strani „Sirevi". */
  category: string;
  /** Natpis iznad naslova na stranici proizvoda. */
  eyebrow: string;
  /** Kratak opis na kartici. */
  tagline: string;
  /** Gramaža u gramima. */
  weight: number | null;
  /** Prodaje se bez gramaže (npr. paket). Bez ovog polja važi staro pravilo: paketi je nemaju. */
  noWeight?: boolean;
  /** Cena u RSD. */
  price: number | null;
  /** Šta je na fotografiji — natpis u okviru koji čeka sliku. */
  photo: string;
  /** Natpis glavne fotografije na stranici proizvoda. */
  photoMain: string;
  /** Putanja do slike: iz /public/slike ili ubačena iz admin panela (/media/…). */
  image?: string;
  /** Uvodni pasus na stranici proizvoda. */
  intro: string;
  /** Harmonika „Opis". */
  description: string;
  /** Harmonika „Sastojci". */
  ingredients: string;
  /** Sekcija „Uz šta ga služiti". */
  serving: { title: string; text: string }[];
};

/** Dugme filtera na strani „Sirevi". `eyebrow` je natpis iznad naslova proizvoda iz tog filtera. */
export type Filter = { id: string; label: string; eyebrow: string };

/** Početni filteri; menjaju se u admin panelu. */
export const defaultFilters: Filter[] = [
  { id: "klasican", label: "Klasičan", eyebrow: "Kozji sir" },
  { id: "sa-ukusima", label: "Sa ukusima", eyebrow: "Kozji sir sa ukusom" },
  { id: "paket", label: "Paketi", eyebrow: "Paket" },
];

/** Ručno složena grupa proizvoda sa svojom stranicom (/kolekcije/…). */
export type Collection = { id: string; name: string; description: string; productSlugs: string[] };

/** Kolekcija koja puni „Izdvojene sireve" na početnoj; ne može da se obriše. */
export const FEATURED_COLLECTION_ID = "izdvojeni";

export const products: Product[] = [
  {
    slug: "klasican-kozji-sir",
    name: "Klasičan kozji sir",
    fullName: "Klasičan kozji sir",
    category: "klasican",
    eyebrow: "Kozji sir",
    tagline: "Beli, blag, pun ukus",
    weight: null,
    price: null,
    photo: "klasičan kozji sir",
    photoMain: "klasičan kozji sir, presek",
    image: "/slike/klasican.jpg",
    intro:
      "Polutvrdi beli kozji sir, bez ikakvih dodataka. Blag je i pun, sa kremastom, blago kiselkastom sredinom — osnova od koje polaze svi naši sirevi.",
    description:
      "Sir se pravi od svežeg kozjeg mleka sa našeg imanja. Posle sirenja i ceđenja ručno se soli i odleži [ZRENJE] dana. Tekstura je čvrsta ali meka pod nožem — seče se na kriške i ne mrvi se.",
    ingredients:
      "Kozje mleko, sirilo, so. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "U salati", text: "Kockice preko paradajza, pečene paprike i maslinovog ulja." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
  {
    slug: "kozji-sir-sa-alevom-paprikom",
    name: "Sa alevom paprikom",
    fullName: "Kozji sir sa alevom paprikom",
    category: "sa-ukusima",
    eyebrow: "Kozji sir sa ukusom",
    tagline: "Topao, blago dimljen ton",
    weight: null,
    price: null,
    photo: "sir sa alevom paprikom",
    photoMain: "sir sa alevom paprikom, presek",
    image: "/slike/aleva-paprika.jpg",
    intro:
      "Polutvrdi beli kozji sir uvaljan u slatku alevu papriku. Paprika mu daje toplu boju i blag, pomalo dimljen ton koji lepo ide uz kremastu, blago kiselkastu sredinu.",
    description:
      "Sir se pravi od svežeg kozjeg mleka sa našeg imanja. Posle sirenja i ceđenja odleži [ZRENJE] dana, a zatim se ručno uvalja u mlevenu papriku. Tekstura je čvrsta ali meka pod nožem — seče se na kriške i ne mrvi se.",
    ingredients:
      "Kozje mleko, sirilo, so, aleva paprika. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "U salati", text: "Kockice preko paradajza, pečene paprike i maslinovog ulja." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
  {
    slug: "kozji-sir-sa-maslinama",
    name: "Sa maslinama",
    fullName: "Kozji sir sa maslinama",
    category: "sa-ukusima",
    eyebrow: "Kozji sir sa ukusom",
    tagline: "Slan, mediteranski",
    weight: null,
    price: null,
    photo: "sir sa maslinama",
    photoMain: "sir sa maslinama, presek",
    image: "/slike/masline.jpg",
    intro:
      "Polutvrdi beli kozji sir sa komadićima maslina. Masline mu daju slan, mediteranski ton koji lepo ide uz kremastu, blago kiselkastu sredinu.",
    description:
      "Sir se pravi od svežeg kozjeg mleka sa našeg imanja. Seckane masline se ručno umešaju pre ceđenja, a sir zatim odleži [ZRENJE] dana. Tekstura je čvrsta ali meka pod nožem — seče se na kriške i ne mrvi se.",
    ingredients:
      "Kozje mleko, sirilo, so, masline. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "U salati", text: "Kockice preko paradajza, krastavca i maslinovog ulja." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
  {
    slug: "kozji-sir-sa-zacinskim-biljem",
    name: "Sa začinskim biljem",
    fullName: "Kozji sir sa začinskim biljem",
    category: "sa-ukusima",
    eyebrow: "Kozji sir sa ukusom",
    tagline: "Svež, mirisan",
    weight: null,
    price: null,
    photo: "sir sa začinskim biljem",
    photoMain: "sir sa začinskim biljem, presek",
    image: "/slike/zacinsko-bilje.jpg",
    intro:
      "Polutvrdi beli kozji sir uvaljan u sušeno začinsko bilje. Bilje mu daje svež, mirisan ton koji lepo ide uz kremastu, blago kiselkastu sredinu.",
    description:
      "Sir se pravi od svežeg kozjeg mleka sa našeg imanja. Posle sirenja i ceđenja odleži [ZRENJE] dana, a zatim se ručno uvalja u začinsko bilje. Tekstura je čvrsta ali meka pod nožem — seče se na kriške i ne mrvi se.",
    ingredients:
      "Kozje mleko, sirilo, so, začinsko bilje. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "U salati", text: "Kockice preko paradajza, pečene paprike i maslinovog ulja." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
  {
    slug: "kozji-sir-sa-belim-lukom-i-mirodjijom",
    name: "Sa belim lukom i mirođijom",
    fullName: "Kozji sir sa belim lukom i mirođijom",
    category: "sa-ukusima",
    eyebrow: "Kozji sir sa ukusom",
    tagline: "Izražen, za namaz i meze",
    weight: null,
    price: null,
    photo: "sir sa belim lukom",
    photoMain: "sir sa belim lukom, presek",
    image: "/slike/beli-luk-mirodjija.jpg",
    intro:
      "Polutvrdi beli kozji sir sa belim lukom i mirođijom. Luk mu daje izražen ukus, a mirođija svežinu koja lepo ide uz kremastu, blago kiselkastu sredinu.",
    description:
      "Sir se pravi od svežeg kozjeg mleka sa našeg imanja. Beli luk i mirođija se ručno umešaju pre ceđenja, a sir zatim odleži [ZRENJE] dana. Tekstura je čvrsta ali meka pod nožem — seče se na kriške, a lako se i maže.",
    ingredients:
      "Kozje mleko, sirilo, so, beli luk, mirođija. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "Kao namaz", text: "Izgnječen viljuškom, na toplom hlebu ili uz pečen krompir." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
  {
    slug: "kozji-sir-sa-sarenim-biberom",
    name: "Sa šarenim biberom",
    fullName: "Kozji sir sa šarenim biberom",
    category: "sa-ukusima",
    eyebrow: "Kozji sir sa ukusom",
    tagline: "Pikantan, aromatičan",
    weight: null,
    price: null,
    photo: "sir sa biberom",
    photoMain: "sir sa biberom, presek",
    image: "/slike/sareni-biber.jpg",
    intro:
      "Polutvrdi beli kozji sir uvaljan u krupno mleveni šareni biber. Biber mu daje pikantan, aromatičan ton koji lepo ide uz kremastu, blago kiselkastu sredinu.",
    description:
      "Sir se pravi od svežeg kozjeg mleka sa našeg imanja. Posle sirenja i ceđenja odleži [ZRENJE] dana, a zatim se ručno uvalja u mleveni biber. Tekstura je čvrsta ali meka pod nožem — seče se na kriške i ne mrvi se.",
    ingredients:
      "Kozje mleko, sirilo, so, šareni biber. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "U salati", text: "Kockice preko paradajza, pečene paprike i maslinovog ulja." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
  {
    slug: "kozji-sir-sa-ljutom-papricicom",
    name: "Sa ljutom papričicom",
    fullName: "Kozji sir sa ljutom papričicom",
    category: "sa-ukusima",
    eyebrow: "Kozji sir sa ukusom",
    tagline: "Ljut, za one koji vole jače",
    weight: null,
    price: null,
    photo: "sir sa ljutom papričicom",
    photoMain: "sir sa ljutom papričicom, presek",
    image: "/slike/ljuta-papricica.jpg",
    intro:
      "Polutvrdi beli kozji sir uvaljan u tucanu ljutu papričicu. Papričica mu daje toplu boju i ljutinu koju kremasta, blago kiselkasta sredina lepo ublaži.",
    description:
      "Sir se pravi od svežeg kozjeg mleka sa našeg imanja. Posle sirenja i ceđenja odleži [ZRENJE] dana, a zatim se ručno uvalja u tucanu papričicu. Tekstura je čvrsta ali meka pod nožem — seče se na kriške i ne mrvi se.",
    ingredients:
      "Kozje mleko, sirilo, so, ljuta papričica. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "U salati", text: "Kockice preko paradajza, pečene paprike i maslinovog ulja." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
  {
    slug: "degustacioni-paket",
    name: "Degustacioni paket",
    fullName: "Degustacioni paket",
    category: "paket",
    eyebrow: "Paket",
    tagline: "Po jedan komad od svakog ukusa",
    weight: null,
    price: null,
    photo: "paket sa više vakuumiranih sireva",
    photoMain: "paket sa više vakuumiranih sireva",
    image: "/slike/degustacioni-paket.jpg",
    intro:
      "Po jedan komad od svakog ukusa u jednom paketu. Za one koji prvi put poručuju i hoće da probaju sve, ili za poklon nekome ko voli dobar sir.",
    description:
      "Svi sirevi u paketu prave se od svežeg kozjeg mleka sa našeg imanja i odleže [ZRENJE] dana. Svaki komad je posebno vakuumiran, pa ih otvarate jedan po jedan, kojim redom želite.",
    ingredients:
      "Kozje mleko, sirilo, so i začin koji piše u nazivu svakog sira: aleva paprika, masline, začinsko bilje, beli luk i mirođija, šareni biber, ljuta papričica. Bez konzervansa, boja i veštačkih aroma. Alergeni: mleko.",
    serving: [
      { title: "Za meze", text: "Na dasci, uz pršutu, orahe i tople lepinje." },
      { title: "U salati", text: "Kockice preko paradajza, pečene paprike i maslinovog ulja." },
      { title: "Uz čašu", text: "Suvo belo vino ili lagano crveno; domaća rakija pre jela." },
    ],
  },
];

/** Paket se ne prodaje na gramažu, pa se kod njega gramaža ne prikazuje. */
export function hasWeight(product: Product): boolean {
  return !(product.noWeight ?? product.category === "paket");
}

/** Proizvodi kolekcije, redom kojim su u njoj; obrisani proizvodi se preskaču. */
export function getCollectionProducts(collection: Collection, products: Product[]): Product[] {
  return collection.productSlugs.flatMap((slug) => {
    const product = products.find((candidate) => candidate.slug === slug);
    return product ? [product] : [];
  });
}

/** „Probajte i ove": prva tri druga sira i paket (ili četiri sira, ako je otvoren paket). */
export function getRelatedProducts(products: Product[], slug: string): Product[] {
  const others = products.filter((product) => product.slug !== slug);
  const cheeses = others.filter((product) => hasWeight(product));
  const packs = others.filter((product) => !hasWeight(product));
  return [...cheeses.slice(0, 4 - Math.min(packs.length, 1)), ...packs.slice(0, 1)];
}
