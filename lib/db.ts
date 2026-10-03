import mysql, { type Pool, type PoolConnection } from "mysql2/promise";
import { defaultFilters, FEATURED_COLLECTION_ID, products as seedProducts } from "@/data/products";

/**
 * Veza sa MySQL bazom. Podaci za pristup su u okruženju (.env.local):
 * DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, i po potrebi DB_SSL ili DB_SSL_CA.
 *
 * Tabele se prave same pri prvom povezivanju, a prazna baza se puni početnim
 * proizvodima iz data/products.ts — na hostingu je dovoljno napraviti praznu
 * bazu i upisati podatke za pristup. Samo za server.
 */

// TEXT umesto JSON kolona: radi isto na MySQL-u i na MariaDB-u, koji je čest na hostingu.
const TABLES = [
  `CREATE TABLE IF NOT EXISTS products (
    slug VARCHAR(191) NOT NULL PRIMARY KEY,
    position INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    category VARCHAR(191) NOT NULL,
    eyebrow VARCHAR(255) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    weight INT NULL,
    no_weight TINYINT(1) NULL,
    price INT NULL,
    sale_price INT NULL,
    in_stock TINYINT(1) NOT NULL DEFAULT 1,
    stock_qty INT NULL,
    low_stock_mode VARCHAR(10) NOT NULL DEFAULT 'off',
    low_stock_threshold INT NULL,
    photo VARCHAR(255) NOT NULL,
    photo_main VARCHAR(255) NOT NULL,
    image VARCHAR(255) NULL,
    intro TEXT NOT NULL,
    description TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    serving TEXT NOT NULL
  )`,
  // Dodatne slike proizvoda, za galeriju na njegovoj stranici.
  `CREATE TABLE IF NOT EXISTS product_images (
    product_slug VARCHAR(191) NOT NULL,
    position INT NOT NULL,
    src VARCHAR(255) NOT NULL,
    PRIMARY KEY (product_slug, position)
  )`,
  `CREATE TABLE IF NOT EXISTS filters (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    position INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    eyebrow VARCHAR(255) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS collections (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    position INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS collection_products (
    collection_id VARCHAR(191) NOT NULL,
    product_slug VARCHAR(191) NOT NULL,
    position INT NOT NULL,
    PRIMARY KEY (collection_id, product_slug)
  )`,
  `CREATE TABLE IF NOT EXISTS pages (
    slug VARCHAR(191) NOT NULL PRIMARY KEY,
    position INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body MEDIUMTEXT NOT NULL,
    show_in_footer TINYINT(1) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS page_images (
    page_slug VARCHAR(191) NOT NULL,
    id VARCHAR(64) NOT NULL,
    position INT NOT NULL,
    src VARCHAR(255) NOT NULL,
    alt VARCHAR(255) NOT NULL,
    PRIMARY KEY (page_slug, id)
  )`,
  // Fotografije ugrađenih stranica (data/page-images.ts) koje su zamenjene iz panela.
  `CREATE TABLE IF NOT EXISTS site_images (
    slot_id VARCHAR(191) NOT NULL PRIMARY KEY,
    src VARCHAR(255) NOT NULL
  )`,
  // Opšta podešavanja ("settings", JSON) i sopstveni šablon emaila ("email_template").
  `CREATE TABLE IF NOT EXISTS settings (
    name VARCHAR(191) NOT NULL PRIMARY KEY,
    value MEDIUMTEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    number INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    received_at DATETIME(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    postal_code VARCHAR(16) NOT NULL,
    note TEXT NOT NULL,
    subtotal INT NULL,
    delivery INT NULL,
    total INT NULL,
    email_error TEXT NULL,
    KEY orders_received_at (received_at)
  ) AUTO_INCREMENT = 1001`,
  // Pravila za popuste (data/discounts.ts).
  `CREATE TABLE IF NOT EXISTS discounts (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    position INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) NOT NULL DEFAULT '',
    percent INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    trigger_type VARCHAR(20) NOT NULL,
    threshold INT NOT NULL
  )`,
  // Kodovi poslati kupcima: jedan red po slanju, pa isti kod (kada ga vlasnik sam upiše)
  // može stajati u više redova. Procenat i naslov su prepis iz pravila, pa poslat kod važi
  // i kada se pravilo promeni ili obriše.
  `CREATE TABLE IF NOT EXISTS discount_codes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    discount_id VARCHAR(191) NOT NULL,
    discount_name VARCHAR(255) NOT NULL,
    percent INT NOT NULL,
    issued_order INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL DEFAULT '',
    created_at DATETIME(3) NOT NULL,
    used_order INT NULL,
    used_at DATETIME(3) NULL,
    KEY discount_codes_code (code),
    KEY discount_codes_discount (discount_id)
  )`,
  // Naziv i cena su prepis iz trenutka poručivanja, pa nema veze ka tabeli products.
  `CREATE TABLE IF NOT EXISTS order_items (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_number INT NOT NULL,
    position INT NOT NULL,
    slug VARCHAR(191) NOT NULL,
    name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    price INT NULL,
    KEY order_items_order (order_number)
  )`,
];

const ADDED_COLUMNS = [
  ["orders", "discount_code", "VARCHAR(32) NULL"],
  ["orders", "discount_percent", "INT NULL"],
  ["orders", "discount_amount", "INT NOT NULL DEFAULT 0"],
  ["orders", "issued_code", "VARCHAR(32) NULL"],
  ["orders", "issued_percent", "INT NULL"],
  ["orders", "issued_title", "VARCHAR(255) NULL"],
  ["products", "sale_price", "INT NULL"],
  ["products", "in_stock", "TINYINT(1) NOT NULL DEFAULT 1"],
  ["products", "stock_qty", "INT NULL"],
  ["products", "low_stock_mode", "VARCHAR(10) NOT NULL DEFAULT 'off'"],
  ["products", "low_stock_threshold", "INT NULL"],
  ["discounts", "code", "VARCHAR(32) NOT NULL DEFAULT ''"],
  ["discount_codes", "phone", "VARCHAR(64) NOT NULL DEFAULT ''"],
];

async function createSchema(pool: Pool) {
  for (const table of TABLES) {
    await pool.query(`${table} ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  // Kolone dodate posle prve verzije tabele: baza koja već postoji dobija ih ovde.
  for (const [table, column, definition] of ADDED_COLUMNS) {
    const [existing] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [table, column],
    );
    if (existing.length === 0) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  // U prvoj verziji je kod bio ključ tabele discount_codes; otkad vlasnik može sam da upiše
  // kod, isti kod ide u više redova, pa ključ postaje redni broj.
  const [codeKey] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'discount_codes' AND column_name = 'id'`,
  );
  if (codeKey.length === 0) {
    await pool.query(
      `ALTER TABLE discount_codes DROP PRIMARY KEY,
        ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
        ADD KEY discount_codes_code (code)`,
    );
  }

  // Početni sadržaj se upisuje samo jednom. Oznaka "seeded" ostaje i kada vlasnik
  // kasnije obriše sve proizvode, pa se oni ne vraćaju sami.
  const [seeded] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT 1 FROM settings WHERE name = 'seeded'",
  );
  if (seeded.length > 0) return;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("INSERT INTO settings (name, value) VALUES ('seeded', ?)", [
      new Date().toISOString(),
    ]);
    await insertProducts(connection, seedProducts);
    await connection.query("INSERT INTO filters (id, position, label, eyebrow) VALUES ?", [
      defaultFilters.map((filter, index) => [filter.id, index, filter.label, filter.eyebrow]),
    ]);
    await connection.query(
      "INSERT INTO collections (id, position, name, description) VALUES (?, 0, 'Izdvojeni sirevi', '')",
      [FEATURED_COLLECTION_ID],
    );
    await connection.query(
      "INSERT INTO collection_products (collection_id, product_slug, position) VALUES ?",
      [
        seedProducts
          .slice(0, 4)
          .map((product, index) => [FEATURED_COLLECTION_ID, product.slug, index]),
      ],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    // Drugi proces je upravo upisao početni sadržaj — to nije greška.
    if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
  } finally {
    connection.release();
  }
}

export async function insertProducts(connection: PoolConnection, products: typeof seedProducts) {
  if (products.length === 0) return;
  await connection.query(
    `INSERT INTO products (slug, position, name, full_name, category, eyebrow, tagline, weight,
      no_weight, price, sale_price, in_stock, stock_qty, low_stock_mode, low_stock_threshold, photo, photo_main,
      image, intro, description, ingredients, serving) VALUES ?`,
    [
      products.map((product, index) => [
        product.slug,
        index,
        product.name,
        product.fullName,
        product.category,
        product.eyebrow,
        product.tagline,
        product.weight,
        product.noWeight ?? null,
        product.price,
        product.salePrice ?? null,
        product.inStock ?? true,
        product.stockQty ?? null,
        product.lowStockMode ?? "off",
        product.lowStockThreshold ?? null,
        product.photo,
        product.photoMain,
        product.image ?? null,
        product.intro,
        product.description,
        product.ingredients,
        JSON.stringify(product.serving),
      ]),
    ],
  );
}

/**
 * Sertifikat iz promenljive okruženja često stigne bez preloma redova (paneli hostinga ih
 * pretvore u razmake ili u tekst "\\n"). Ovde se vraća u ispravan PEM oblik: zaglavlje,
 * sadržaj u redovima od 64 znaka, podnožje.
 */
function normalizePem(value: string): string {
  const body = value
    .replace(/-----(BEGIN|END) CERTIFICATE-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----\n`;
}

// Na globalThis, da razvojni server pri svakoj izmeni koda ne otvara novi skup veza.
const globalForDb = globalThis as unknown as { stojkovicDb?: Promise<Pool> };

/** Skup veza ka bazi; pri prvom pozivu pravi tabele i početni sadržaj. */
export function getDb(): Promise<Pool> {
  if (!globalForDb.stojkovicDb) {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL, DB_SSL_CA } = process.env;
    if (!DB_HOST || !DB_USER || !DB_NAME) {
      throw new Error(
        "Baza nije podešena: upišite DB_HOST, DB_USER, DB_PASSWORD i DB_NAME u .env.local.",
      );
    }
    const pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT ? Number(DB_PORT) : 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      charset: "utf8mb4",
      // Baze u oblaku traže šifrovanu vezu. DB_SSL_CA je sertifikat provajdera (ceo PEM tekst);
      // DB_SSL=true je dovoljno kada provajder koristi javno priznat sertifikat.
      ssl: DB_SSL_CA ? { ca: normalizePem(DB_SSL_CA) } : DB_SSL === "true" ? {} : undefined,
      // Vreme se čuva i čita kao UTC, nezavisno od podešavanja servera.
      timezone: "Z",
      connectionLimit: 5,
    });
    globalForDb.stojkovicDb = createSchema(pool).then(
      () => pool,
      (error) => {
        // Sledeći zahtev pokušava ponovo, npr. kada se baza u međuvremenu pokrene.
        globalForDb.stojkovicDb = undefined;
        void pool.end().catch(() => {});
        throw error;
      },
    );
  }
  return globalForDb.stojkovicDb;
}
