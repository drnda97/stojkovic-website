import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart-provider";
import { themeCss } from "@/data/settings";
import { getFreeShippingFrom, getProducts, getSettings } from "@/lib/content";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

// Sadržaj je u bazi i menja se iz admin panela, pa se stranice prave pri svakoj poseti:
// izmena se vidi odmah, a build ne zavisi od toga da li je baza dostupna.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { favicon } = await getSettings();
  return {
    title: {
      template: "%s — Gazdinstvo Stojković",
      default: "Gazdinstvo Stojković",
    },
    description:
      "Domaći kozji sirevi Poljoprivrednog gazdinstva Stojković: klasičan i sa začinima, ručna proizvodnja. Dostava širom Srbije, plaćanje pouzećem.",
    // Favicon se menja u admin panelu; dok ga nema, važi public/icon.svg.
    icons: { icon: favicon ?? "/icon.svg" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [products, settings, freeShippingFrom] = await Promise.all([
    getProducts(),
    getSettings(),
    getFreeShippingFrom(),
  ]);
  // Boje i fontovi izabrani u admin panelu; prazno dok je sve po dizajnu.
  const theme = themeCss(settings);

  return (
    <html lang="sr-Latn" className={fontVariables}>
      <body>
        {theme && <style dangerouslySetInnerHTML={{ __html: theme }} />}
        <CartProvider products={products} freeShippingFrom={freeShippingFrom}>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
