# Gazdinstvo Stojković — web prodavnica

Mala prodavnica kozjih sireva bez online naplate: kupac dodaje u korpu, ostavi adresu i telefon, a plaća kuriru pouzećem. Next.js (App Router), TypeScript, Tailwind CSS, MySQL. Bez plaćenih servisa.

## Pokretanje

Potreban je Node.js 20 ili noviji.

```bash
npm install
npm run dev      # razvoj, http://localhost:3000
npm run build    # produkciona verzija
npm run start    # pokretanje produkcione verzije
npm run lint
```

## Admin panel

Adresa: `/admin-panel-stojkovic` (nema linka na sajtu, do njega se dolazi samo upisom adrese). Prijava je jednim nalogom iz `.env.local`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=…
```

Posle izmene `.env.local` server se pokreće ponovo. Na produkciji se iste dve promenljive upisuju u okruženje servera.

Panel ima bočni meni:

| Deo | Šta se tu radi |
|---|---|
| Pregled | prodaja i porudžbine za poslednjih 30 dana, najprodavaniji proizvodi, gradovi, kupci |
| Porudžbine | sve porudžbine sa sajta; označavaju se kao poslate ili otkazane |
| Proizvodi | dodavanje, izmena i brisanje proizvoda, sa slikom; stanje i oznaka „pri kraju" |
| Kolekcije | ručno složene grupe proizvoda, svaka sa stranicom `/kolekcije/…`; kolekcija „Izdvojeni sirevi" puni početnu stranu |
| Filteri | dugmad na strani „Sirevi"; svaki proizvod pripada jednom filteru |
| Popusti | pravila po kojima kupac posle porudžbine dobija kod za popust pri sledećoj kupovini |
| Stranice | fotografije ugrađenih stranica (Početna, O nama, Stranica proizvoda) i pravljenje novih stranica sa naslovom, tekstom i fotografijama |
| Podešavanja → Opšte | boje, fontovi, logo i favicon sajta; besplatna dostava; email o porudžbini (kome se šalje, SMTP nalog, šablon) |

Izmene se vide na sajtu odmah.

## Baza i rezervna kopija

Sve što se menja iz panela i sve porudžbine čuvaju se u MySQL bazi. Podaci za pristup su u `.env.local`:

```
DB_HOST=127.0.0.1
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=stojkovic
```

Baze u oblaku obično traže šifrovanu vezu: tada se dodaje `DB_SSL_CA` (ceo tekst CA sertifikata provajdera) ili, ako provajder koristi javno priznat sertifikat, `DB_SSL=true`.

Tabele se prave same pri prvom pokretanju, a prazna baza se puni početnim proizvodima iz `data/products.ts` (`lib/db.ts`). Na hostingu je dovoljno napraviti praznu bazu i upisati njene podatke u okruženje. Posle prvog punjenja proizvodi se menjaju u panelu, a izmene u `data/products.ts` više nemaju efekta.

Na disku ostaju samo fajlovi ubačenih slika, u `storage/uploads/` (nije u git-u; folder se može premestiti promenljivom `UPLOADS_DIR`). Taj folder treba sačuvati pri deploy-u.

Rezervna kopija baze i slika:

```bash
npm run backup   # pravi backups/stojkovic-<datum>.sql i -slike.tar.gz
```

Skripta koristi `mysqldump`; ako nije u PATH-u, putanja se upisuje u `MYSQLDUMP_PATH` u `.env.local`. U bazi su lični podaci kupaca i lozinka email naloga, pa kopije ne treba držati na javnom mestu.

Hosting mora da podržava Node.js aplikacije (ne samo PHP), jer sajt radi kao Node server (`npm run build`, pa `npm run start`).

Novo mesto za fotografiju na ugrađenoj stranici dodaje se u `data/page-images.ts`.

## Gde se šta menja

| Šta | Fajl |
|---|---|
| Proizvodi, cene, gramaže, opisi, sastojci | admin panel (početne vrednosti: `data/products.ts`) |
| Fotografije | admin panel (početne: `public/slike/`) |
| Telefon, email, mesto, rokovi, cena dostave | `data/site.ts` |
| Lična priča gazdinstva | `app/(shop)/o-nama/page.tsx` |
| Česta pitanja | `app/(shop)/cesta-pitanja/page.tsx` |
| Prijem i čuvanje porudžbine | `lib/order-store.ts` (funkcija `submitOrder`) |
| Boje i fontovi | admin panel (početne: `app/globals.css`, `lib/fonts.ts`) |

### Cene i gramaže

Cena i gramaža proizvoda upisuju se u admin panelu. **Trenutne cene, gramaže, i cena dostave (450 RSD) su probne vrednosti**, upisane da bi korpa i poručivanje mogli da se testiraju. Proizvod bez cene prikazuje „[CENA] RSD", a bez gramaže „[GRAMAŽA] g". Cena dostave (`deliveryPrice`) je u `data/site.ts`.

### Fotografije

Sve fotografije na sajtu su **privremene**, preuzete sa Unsplash-a, i ne prikazuju sireve ni imanje gazdinstva. Nalaze se u `public/slike/`, a spisak sa autorima i izvorima je u `FOTOGRAFIJE.md`.

Zamena: iz admin panela — slika proizvoda u formi proizvoda, a ostale u delu „Slike po stranicama". Dodatne slike za galeriju proizvoda dodaju se u istoj formi. Proizvod bez slike prikazuje sivi okvir sa natpisom iz dizajna.

## Porudžbine i email

Porudžbina se proverava na serveru i čuva u bazi (`submitOrder` u `lib/order-store.ts`), dobija redni broj i pojavljuje se u admin panelu.

Posle upisa sajt šalje email prodavcu (obaveštenje) i kupcu (potvrda) — `lib/order-email.ts`, preko paketa `nodemailer`. **Email radi tek kada se u panelu, u Podešavanja → Opšte, upiše SMTP nalog**; do tada panel na Pregledu upozorava da nije podešen. Email je obavezno polje pri poručivanju, pa potvrdu dobija svaki kupac. Ako slanje ne uspe, porudžbina ostaje sačuvana, a razlog se vidi uz nju u panelu.

Šablon emaila je u `lib/email-template.ts`. Vlasnik iz panela može da ga preuzme, izmeni i ubaci kao svoj; mesta poput `{{stavke}}` i `{{ukupno}}` zamenjuju se podacima porudžbine (spisak je u panelu).

Boje i fontovi izabrani u panelu prepisuju tokene iz `app/globals.css`. Spisak fontova koji se nude je u `data/settings.ts` i `lib/fonts.ts`.

## Slike proizvoda

Proizvod ima glavnu sliku (kartica, korpa, vrh galerije) i proizvoljan broj dodatnih slika, koje se dodaju i uklanjaju u formi proizvoda. Na stranici proizvoda galerija je slajder sa strelicama (`components/product-gallery.tsx`): na telefonu se slike menjaju prevlačenjem, a na većem ekranu i klikom na male slike ispod. Proizvod bez dodatnih slika ispod glavne prikazuje tri zajedničke fotografije iz dela Stranice → Stranica proizvoda.

## Stanje proizvoda

Svaki proizvod ima stanje (admin → Proizvodi). Dva načina:

- **Ručno:** „Na stanju" / „Nema na stanju", menja se na klik u spisku proizvoda.
- **Po broju komada:** kada se u formi proizvoda upiše broj komada, stanje se vodi samo — svaka porudžbina ga smanjuje, na nuli je proizvod rasprodat, a otkazivanje porudžbine vraća komade. Broj se može ispraviti i direktno u spisku.

Rasprodat proizvod ostaje vidljiv na sajtu sa oznakom „Rasprodato" i ne može u korpu. Kupac ne može da poruči više komada nego što ih ima; to proverava i server pri upisu porudžbine (`findStockProblem` u `lib/cart.ts`, `insertOrder` u `lib/order-store.ts`).

Oznaka „pri kraju" za kupca podešava se u formi proizvoda: isključena, uvek prikazana, ili sama kada broj komada padne na upisani prag („Još samo 3 kom."). Pravila su u `data/products.ts` (`isAvailable`, `lowStockLabel`).

## Akcija (snižena cena)

U formi proizvoda, pored redovne cene, upisuje se **cena na akciji**. Dok je upisana i niža od redovne, proizvod se prodaje po njoj: na sajtu je stara cena precrtana, uz oznaku „Akcija −20%" (procenat se računa sam), a korpa, poručivanje i porudžbina koriste akcijsku cenu (`currentPrice` u `data/products.ts`). Brisanjem polja akcija prestaje.

## Popusti i besplatna dostava

**Popusti** (admin → Popusti). Svako pravilo ima procenat, status (nacrt ili aktivan) i jedan uslov: prva porudžbina kupca, vrednost porudžbine od zadatog iznosa, ili težina od zadate gramaže. Posle svake porudžbine bira se najjači aktivan popust čiji je uslov ispunjen (`pickDiscount` u `data/discounts.ts`), i kupac u emailu dobija kod sa naslovom popusta. Kod upisuje vlasnik uz popust (npr. `SIR10`); ako ga ne upiše, svaki kupac dobija svoj nasumičan kod, npr. `SIR-7K3Q9X`. Kod važi za jednu kupovinu i samo za kupca kome je poslat (isti email ili telefon), a upisuje se u korpi ili na strani za poručivanje. Popust se obračunava na serveru (`getPricing` u `lib/cart.ts`, `submitOrder` u `lib/order-store.ts`). Kupac se prepoznaje po emailu ili telefonu. Brisanje pravila ne poništava već poslate kodove.

**Besplatna dostava** (admin → Podešavanja → Opšte) je podrazumevano isključena. Kada se uključi i upiše iznos, kupac u korpi vidi traku sa kolutom sira koja pokazuje koliko fali do besplatne dostave. Gleda se vrednost proizvoda posle popusta. Cena dostave (`deliveryPrice`) je i dalje u `data/site.ts`.

## Placeholderi koje treba popuniti

| Placeholder | Šta je | Gde se popunjava |
|---|---|---|
| `[CENA]` | cena proizvoda | admin panel → Proizvodi |
| `[GRAMAŽA]` | gramaža proizvoda | admin panel → Proizvodi |
| `[ZRENJE]` | koliko dana sir odleži | `data/products.ts` → tekst `description` svakog proizvoda |
| `[TELEFON]` | kontakt telefon | `data/site.ts` → `phone` |
| `[EMAIL]` | kontakt email | `data/site.ts` → `email` |
| `[MESTO]` | mesto gazdinstva | `data/site.ts` → `place` |
| `[GODINA]` | od kada držite koze | `data/site.ts` → `since` |
| `[ROK]` | rok isporuke u radnim danima | `data/site.ts` → `deliveryTime` |
| `[DANI SLANJA]` | kojim danima šaljete | `data/site.ts` → `shippingDays` |
| `[BROJ]` (dana posle otvaranja) | za koliko dana potrošiti otvoren sir | `data/site.ts` → `useWithinDays` |
| `[ROK TRAJANJA]` | rok trajanja neotvorenog sira | `data/site.ts` → `shelfLife` |
| `[ROK ZA POZIV]` | kada se javljate kupcu | `data/site.ts` → `callbackTime` |
| `[CENA DOSTAVE]` | cena dostave | `data/site.ts` → `deliveryPrice` |
| `[IZNOS]` (međuzbir), `[UKUPNO]` | računaju se sami | nestaju kada se upišu cene i cena dostave |
| `[OVDE IDE VAŠA LIČNA PRIČA …]` | pasus o gazdinstvu | `app/(shop)/o-nama/page.tsx` |

Napomena: uz `[ROK]` u tekstu stoji „radna dana". Ako upišete broj uz koji to ne zvuči dobro (npr. „5"), ispravite i reč u `app/(shop)/sirevi/[slug]/page.tsx`, `app/(shop)/cesta-pitanja/page.tsx` i `components/checkout.tsx`.

Opise i sastojke za sedam proizvoda (svi osim sira sa alevom paprikom) vlasnik treba da pročita i ispravi u `data/products.ts` — napisani su po uzoru na jedini opis iz dizajna i ne znamo da li tačno odgovaraju načinu pravljenja.

## Struktura

- `app/(shop)/` — početna, `/sirevi`, `/sirevi/[slug]`, `/o-nama`, `/cesta-pitanja`
- `app/(checkout)/porudzbina/` — forma i `/porudzbina/hvala`
- `components/` — zaglavlje, footer, kartica proizvoda, okvir za sliku, brojač količine, harmonika, drawer korpe, forma porudžbine
- `data/` — proizvodi i podaci o gazdinstvu
- `lib/` — korpa (localStorage), formatiranje, porudžbine
- `design-reference/` — odobreni dizajn, izvor istine za izgled i tekst
