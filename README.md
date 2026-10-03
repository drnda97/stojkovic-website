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

## Gde se šta menja

| Šta | Fajl |
|---|---|
| Proizvodi, cene, gramaže, opisi, sastojci | `data/products.ts` |
| Telefon, email, mesto, rokovi, cena dostave | `data/site.ts` |
| Lična priča gazdinstva | `app/(shop)/o-nama/page.tsx` |
| Česta pitanja | `app/(shop)/cesta-pitanja/page.tsx` |
| Slanje porudžbine vlasniku | `lib/orders.ts` (funkcija `submitOrder`) |
| Boje i fontovi | `app/globals.css`, `app/layout.tsx` |

### Cene i gramaže

U `data/products.ts` svaki proizvod ima `price` (RSD) i `weight` (grami). Dok je vrednost `null`, sajt prikazuje „[CENA] RSD" i „[GRAMAŽA] g". Kada se upiše broj (npr. `price: 950`), cena se prikazuje svuda, a međuzbir u korpi se računa sam. Ukupan iznos se računa kada su upisane sve cene u korpi i cena dostave (`deliveryPrice` u `data/site.ts`). Ako se upiše i `freeDeliveryFrom`, dostava je besplatna za porudžbine od tog iznosa naviše.

### Fotografije

Sve fotografije na sajtu su **privremene**, preuzete sa Unsplash-a, i ne prikazuju sireve ni imanje gazdinstva. Nalaze se u `public/slike/`, a spisak sa autorima i izvorima je u `FOTOGRAFIJE.md`.

Zamena: stavite pravu fotografiju u `public/slike/` pod istim imenom fajla (npr. `klasican.jpg`) i ona se pojavljuje svuda gde je bila stara. Tri male fotografije u galeriji proizvoda (`galerija-*.jpg`) su za sada iste za sve sireve; podešavaju se u `galleryThumbs` u `data/products.ts`. Ako se nekom proizvodu obriše `image`, na njegovom mestu se vraća sivi okvir sa natpisom iz dizajna.

## Porudžbine — još nisu povezane

Porudžbina se trenutno proverava na serveru i **upisuje samo u log servera**. Vlasniku ne stiže ništa dok se u `lib/orders.ts` (`submitOrder`) ne priključi pravo slanje — email, SMS ili admin panel. Mesto je označeno komentarom. Pre puštanja sajta u rad ovo mora da se uradi.

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
| `[BROJ]` (Porudžbina br.) | broj porudžbine | `lib/orders.ts` → `orderNumber`, kada se poveže slanje |
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
