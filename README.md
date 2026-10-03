# Gazdinstvo Stojković — web prodavnica

Mala prodavnica kozjih sireva bez online naplate: kupac dodaje u korpu, ostavi adresu i telefon, a plaća kuriru pouzećem. Next.js (App Router), TypeScript, Tailwind CSS. Bez baze i bez plaćenih servisa.

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
| Proizvodi | dodavanje, izmena i brisanje proizvoda, sa slikom |
| Kolekcije | ručno složene grupe proizvoda, svaka sa stranicom `/kolekcije/…`; kolekcija „Izdvojeni sirevi" puni početnu stranu |
| Filteri | dugmad na strani „Sirevi"; svaki proizvod pripada jednom filteru |
| Stranice | fotografije ugrađenih stranica (Početna, O nama, Stranica proizvoda) i pravljenje novih stranica sa naslovom, tekstom i fotografijama |
| Podešavanja → Opšte | boje, fontovi, logo i favicon sajta; email o porudžbini (kome se šalje, SMTP nalog, šablon) |

Izmene se vide na sajtu odmah.

Sve što se sačuva iz panela ide u folder `storage/` (`content.json`, `orders.json`, `uploads/` i, ako je ubačen, `email-template.html`), koji nije u git-u. U `orders.json` su lični podaci kupaca, a u `content.json` lozinka email naloga. Zato:

- sajt mora da radi na serveru sa trajnim diskom (`npm run start` na VPS-u ili sličnom); na Vercel-u i sličnim serverless platformama izmene bi se gubile;
- `storage/` treba čuvati pri deploy-u i uključiti u backup;
- dok `storage/content.json` ne postoji, prikazuju se početni proizvodi iz `data/products.ts` i slike iz `public/slike/`. Od prve izmene iz panela, proizvodi se čitaju iz `storage/` i izmene u `data/products.ts` više nemaju efekta.

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

U `data/products.ts` svaki proizvod ima `price` (RSD) i `weight` (grami). Dok je vrednost `null`, sajt prikazuje „[CENA] RSD" i „[GRAMAŽA] g". Kada se upiše broj (npr. `price: 950`), cena se prikazuje svuda, a međuzbir u korpi se računa sam. Ukupan iznos se računa kada su upisane sve cene u korpi i cena dostave (`deliveryPrice` u `data/site.ts`). Ako se upiše i `freeDeliveryFrom`, dostava je besplatna za porudžbine od tog iznosa naviše.

### Fotografije

Sve fotografije na sajtu su **privremene**, preuzete sa Unsplash-a, i ne prikazuju sireve ni imanje gazdinstva. Nalaze se u `public/slike/`, a spisak sa autorima i izvorima je u `FOTOGRAFIJE.md`.

Zamena: iz admin panela — slika proizvoda u formi proizvoda, a ostale u delu „Slike po stranicama". Tri male fotografije u galeriji proizvoda su za sada iste za sve sireve. Proizvod bez slike prikazuje sivi okvir sa natpisom iz dizajna.

## Porudžbine i email

Porudžbina se proverava na serveru i čuva u `storage/orders.json` (`submitOrder` u `lib/order-store.ts`), dobija redni broj i pojavljuje se u admin panelu.

Posle upisa sajt šalje email prodavcu (obaveštenje) i kupcu (potvrda) — `lib/order-email.ts`, preko paketa `nodemailer`. **Email radi tek kada se u panelu, u Podešavanja → Opšte, upiše SMTP nalog**; do tada panel na Pregledu upozorava da nije podešen. Email je obavezno polje pri poručivanju, pa potvrdu dobija svaki kupac. Ako slanje ne uspe, porudžbina ostaje sačuvana, a razlog se vidi uz nju u panelu.

Šablon emaila je u `lib/email-template.ts`. Vlasnik iz panela može da ga preuzme, izmeni i ubaci kao svoj; mesta poput `{{stavke}}` i `{{ukupno}}` zamenjuju se podacima porudžbine (spisak je u panelu).

Boje i fontovi izabrani u panelu prepisuju tokene iz `app/globals.css`. Spisak fontova koji se nude je u `data/settings.ts` i `lib/fonts.ts`.

## Placeholderi koje treba popuniti

| Placeholder | Šta je | Gde se popunjava |
|---|---|---|
| `[CENA]` | cena proizvoda | `data/products.ts` → `price` |
| `[GRAMAŽA]` | gramaža proizvoda | `data/products.ts` → `weight` |
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
| `[IZNOS]` (česta pitanja) | iznos za besplatnu dostavu | `data/site.ts` → `freeDeliveryFrom` |
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
