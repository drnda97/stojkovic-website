/**
 * Podaci o gazdinstvu koji se ponavljaju kroz sajt.
 *
 * Sve vrednosti u uglastim zagradama su mesta za podatke koje još nemamo.
 * Kada ih vlasnik dostavi, upisuju se ovde i menjaju se svuda na sajtu.
 */
export const site = {
  name: "Gazdinstvo Stojković",
  instagramUrl: "https://www.instagram.com/pg.stojkovic2023",
  instagramLabel: "Instagram · @pg.stojkovic2023",

  /** Kontakt telefon — footer, česta pitanja, footer porudžbine. */
  phone: "[TELEFON]",
  /** Kontakt email — footer, česta pitanja. */
  email: "[EMAIL]",
  /** Mesto gazdinstva — footer, O nama. */
  place: "[MESTO]",
  /** Godina od koje gazdinstvo drži koze — O nama. */
  since: "[GODINA]",

  /** Rok isporuke u radnim danima, npr. "2–3" — proizvod, česta pitanja, porudžbina. */
  deliveryTime: "[ROK]",
  /** Dani kada se paketi predaju kuriru, npr. "ponedeljkom i utorkom". */
  shippingDays: "[DANI SLANJA]",
  /** Za koliko dana treba potrošiti sir posle otvaranja. */
  useWithinDays: "[BROJ]",
  /** Rok trajanja neotvorenog sira — česta pitanja. */
  shelfLife: "[ROK TRAJANJA]",
  /** Kada se javljate kupcu posle porudžbine, npr. "24 sata" — ekran „Hvala". */
  callbackTime: "[ROK ZA POZIV]",

  /**
   * Cena dostave u RSD. Dok je null, prikazuje se „[CENA DOSTAVE] RSD".
   * 450 je PROBNA vrednost, za testiranje korpe i poručivanja.
   * Besplatna dostava za veće porudžbine podešava se u admin panelu.
   */
  deliveryPrice: 450 as number | null,
};
