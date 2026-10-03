import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getSettings } from "@/lib/content";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const { logo } = await getSettings();

  return (
    <>
      <AnnouncementBar />
      <Header logo={logo} />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
