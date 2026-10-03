# Prompt za Claude u VS Code-u — web prodavnica Gazdinstva Stojković

Napravi od nule Next.js projekat: malu web prodavnicu kozjih sireva za Poljoprivredno gazdinstvo Stojković. Dizajn je već gotov i odobren. Tvoj posao je da ga preneseš u kod 1/1, ne da ga dizajniraš ponovo.

## Šta je ovo i za koga

Vlasnik gazdinstva prodaje domaće kozje sireve (klasičan i sa ukusima: aleva paprika, masline, začinsko bilje…). Sajt je klasičan mali e-commerce bez online naplate: kupac dodaje u korpu, ostavi adresu i telefon, a plaća kuriru pouzećem. Sajt se pravi jednom i predaje vlasniku, koji plaća samo hosting i domen — zato bez plaćenih servisa i bez pretplata u osnovi projekta.

Kupci su obični ljudi, često na telefonu, pa sve mora da bude jednostavno i čitljivo. Sav tekst je na srpskom, latinicom (`lang="sr-Latn"`).

## Izvor dizajna: folder `design-reference/`

U folderu `design-reference/` je sedam fajlova. To je izvor istine za izgled i za sav tekst:

| Fajl | Šta je | Ruta u projektu |
|---|---|---|
| `Main.dc.html` | Početna | `/` |
| `Kolekcija.dc.html` | Lista sireva | `/sirevi` |
| `Proizvod.dc.html` | Stranica proizvoda | `/sirevi/[slug]` |
| `O-nama.dc.html` | O nama | `/o-nama` |
| `Pitanja.dc.html` | Česta pitanja | `/cesta-pitanja` |
| `Korpa.dc.html` | Korpa (drawer) sa dve stavke | komponenta, nije ruta |
| `Checkout.dc.html` | Porudžbina + ekran „Hvala" | `/porudzbina` i `/porudzbina/hvala` |

Kako se čitaju ti fajlovi (ne mogu se otvoriti u pregledaču sami za sebe, čitaj ih kao izvorni kod):

- Sadržaj stranice je unutar `<x-dc>`. Blok `<helmet>` nosi Google Fonts link i nekoliko CSS klasa (`.ph`, `.eyebrow`, `.btn`, `.chip`, `.in`, `.step`, stilovi za `details/summary`).
- Sve ostalo je u inline `style` atributima. To su tačne vrednosti: boje, veličine fonta, razmaci, `clamp()` izrazi, `grid-template-columns`. Prepiši ih doslovno. Ne zaokružuj na Tailwind skalu i ne „popravljaj" ih.
- `{{ime}}` je vezana vrednost, `<sc-if value="{{uslov}}">` je uslovni prikaz, a klasa `Component` u `<script>` bloku na dnu fajla drži stanje (količina, otvorena korpa, potvrđena porudžbina). To prevedi u React stanje.
- Tekst u uglastim zagradama (`[CENA]`, `[GRAMAŽA]`, `[TELEFON]`, `[MESTO]`, `[ROK]`…) su namerno ostavljena mesta za podatke koje još nemamo. Zadrži ih tačno takve; ne izmišljaj cene, gramaže, telefone ni rokove.
- Sivi okviri sa natpisom „Fotografija · …" su mesta za slike koje stižu kasnije. Zadrži ih kao komponentu sa istim natpisom i istim odnosom stranica.

Pre nego što napišeš ijednu komponentu, pročitaj svih sedam fajlova u celosti.

## Šta znači 1/1

Isti raspored, isti tekstovi od reči do reči, iste boje, fontovi, veličine i razmaci, isti redosled sekcija, isto ponašanje na užim ekranima (gridovi u referenci već koriste `repeat(auto-fit, minmax(min(Npx, 100%), 1fr))` — zadrži to).

Nemoj dodavati ništa čega nema u referenci: bez gradijenata, senki, zaobljenih uglova, ikonica i biblioteka ikonica, bez novih sekcija, bez dodatnog marketinškog teksta, bez animacija osim kratkog ulaska drawera. Dizajn je namerno miran i ravan; to je deo premium utiska koji se klijentu dopao.

Tokeni koji se ponavljaju kroz sve fajlove (izvuci ih u temu):

- Podloga `#F6F1E7`, tamnija traka `#EFE8DA`, polja forme `#FBF8F1`, placeholder slike `#E7DFCF` / `#E1D8C5`
- Tekst `#1E1B16`, sporedni tekst `#5F5849`
- Akcenat (mesing) `#7A5C25`, na tamnoj podlozi `#D9BF8A`
- Linije `#DDD4C2`, `#CFC4AE`, `#BDB29C`; na tamnom `#3A352C`; tekst u footeru `#CFC6B4`
- Naslovi: Cormorant Garamond, težina 500. Tekst: Jost 400/500.
- Kontejner `max-width: 1200px`, bočni padding `32px`

## Tehnologija

- Next.js (App Router, poslednja stabilna verzija), TypeScript, React Server Components gde ima smisla, klijentske komponente samo za korpu, brojač količine, filtere i formu.
- Tailwind CSS sa tokenima iz liste iznad u temi. Gde referenca ima vrednost koje nema u skali, koristi proizvoljne vrednosti (`text-[25px]`, `gap-[14px]`) umesto najbliže standardne.
- Fontovi preko `next/font/google`, sa `latin-ext` podskupom (zbog č, ć, š, ž, đ).
- Bez UI biblioteka. Komponente su dovoljno jednostavne da se napišu ručno.

## Struktura

Zajedničke komponente, izvučene iz onoga što se u referenci ponavlja: traka sa obaveštenjem na vrhu, zaglavlje (sa označenom aktivnom stavkom, kao u referenci), footer, kartica proizvoda, placeholder slike, brojač količine, harmonika (`details/summary`), drawer korpe.

Proizvodi žive na jednom mestu, u tipiziranom fajlu (npr. `data/products.ts`): slug, naziv, kratak opis sa kartice, kategorija (klasičan / sa ukusima / paket), gramaža, cena, tekstovi za stranicu proizvoda. Cena i gramaža su `number | null`; dok su `null`, prikazuje se placeholder iz reference (`[CENA] RSD`, `[GRAMAŽA] g`). Tako vlasnik kasnije upiše prave vrednosti na jednom mestu, a kasnije se isti oblik podataka može puniti iz admin panela.

Osam proizvoda i njihovi opisi su u `Kolekcija.dc.html`. Stranica proizvoda u referenci postoji samo za „Kozji sir sa alevom paprikom"; to je šablon za sve. Za ostale proizvode tekstove opisa i sastojaka napiši u istom tonu i iste dužine, menjajući samo ono što se odnosi na začin.

## Gde se pravi projekat razlikuje od prototipa

Prototip je crtež sa malo logike, pa je na nekoliko mesta uprošćen. U projektu to treba da radi stvarno:

- **Korpa je jedna za ceo sajt.** U prototipu svaka stranica ima svoje stanje, pa je drawer van stranice proizvoda uvek prazan. U projektu: React context + `localStorage`, broj u zaglavlju „Korpa (n)" tačan na svakoj stranici, drawer prikazuje stvarne stavke svuda. Izgled popunjene korpe uzmi iz `Korpa.dc.html`, prazne iz drawera u `Main.dc.html`.
- **„Dodaj u korpu"** dodaje izabranu količinu i otvara drawer.
- **Drawer** se zatvara klikom na zatamnjenu pozadinu, na ×, i tasterom Esc; dok je otvoren, fokus ostaje u njemu i stranica iza se ne skroluje.
- **Kartice proizvoda** vode svaka na svoj slug (u prototipu sve vode na istu stranicu).
- **Filteri na kolekciji** (Svi / Klasičan / Sa ukusima / Paketi) stvarno filtriraju, a broj proizvoda pored se ažurira.
- **Međuzbir i ukupno** se računaju kada cene postoje; dok su `null`, ostaje placeholder iz reference.
- **Checkout** prikazuje stvarni sadržaj korpe u pregledu sa desne strane. Sa praznom korpom preusmerava na `/sirevi`.
- **Forma** ima validaciju: ime, telefon, ulica i broj, mesto i poštanski broj su obavezni; email i napomena nisu. Poruke o greškama na srpskom, ispod polja, u istom mirnom stilu (sporedna boja teksta, bez crvenih okvira koji iskaču iz dizajna — tamnija linija i kratak tekst su dovoljni).
- **Posle potvrde** korpa se prazni i korisnik ide na `/porudzbina/hvala` (izgled je druga `sc-if` grana u `Checkout.dc.html`).

## Slanje porudžbine — ostavi izolovano

Još nije odlučeno gde vlasniku stižu porudžbine (email, SMS ili admin panel). Zato svu logiku stavi iza jedne funkcije, npr. `submitOrder(order)` u `lib/orders.ts`, koju poziva server action. Za sada neka validira podatke na serveru i upiše porudžbinu u log; ostavi jasan komentar da se tu kasnije priključuje pravo slanje. Ne uvodi bazu, servis za email ni autentifikaciju dok to ne bude dogovoreno.

## Ostalo

- Metadata po stranici (naslov i opis na srpskom, naslovi su u `<title>` svakog referentnog fajla).
- Semantički HTML kao u referenci: pravi `button`, `a`, `label` + `input`, `details/summary`.
- Slike: placeholder komponenta napravljena tako da se kasnije zameni sa `next/image` bez diranja rasporeda.
- Kratak `README.md` na srpskom: kako se pokreće, gde se menjaju proizvodi i cene, i spisak svih placeholdera u uglastim zagradama sa fajlom u kome se nalaze, da vlasnik zna šta treba da popuni.

## Kako da radiš

1. Pročitaj sve fajlove u `design-reference/`.
2. Postavi projekat, temu i fontove, pa zajedničke komponente.
3. Pravi stranicu po stranicu, držeći otvoren odgovarajući referentni fajl i prenoseći vrednosti iz njega.
4. Kada završiš, pokreni `npm run build` i lint, i pokreni sajt lokalno. Prođi ceo tok: početna → kolekcija → proizvod → dodaj u korpu → drawer → porudžbina → hvala. Proveri i na širini telefona (oko 390px).
5. Na kraju mi napiši šta je urađeno, šta se razlikuje od reference i zašto, i šta nisi mogao da proveriš.

Ako u referenci nešto nije jasno ili se dva fajla ne slažu, pitaj pre nego što sam odlučiš.
