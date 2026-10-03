import {
  Cormorant_Garamond,
  Inter,
  Jost,
  Lora,
  Montserrat,
  Open_Sans,
  Playfair_Display,
} from "next/font/google";

/**
 * Fontovi koje vlasnik može da izabere u admin panelu (spisak: data/settings.ts).
 * Podrazumevani par se učitava unapred; ostali samo kada su izabrani.
 */

// next/font traži da podešavanja budu ispisana na licu mesta, bez zajedničkih promenljivih.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  preload: false,
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  preload: false,
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  preload: false,
});
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  preload: false,
});
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  preload: false,
});

/** Klase za <html>: svaka definiše CSS promenljivu svog fonta. */
export const fontVariables = [cormorant, jost, playfair, lora, inter, montserrat, openSans]
  .map((font) => font.variable)
  .join(" ");
