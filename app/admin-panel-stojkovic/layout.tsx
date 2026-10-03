import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { builtInPages } from "@/data/page-images";
import { ADMIN_PATH, isAdmin, isAdminConfigured } from "@/lib/admin-auth";
import { getPages } from "@/lib/content";
import { getOrders } from "@/lib/order-store";
import { logout } from "./actions";
import { LoginForm } from "./login-form";
import { NavLink } from "./nav";

export const metadata: Metadata = {
  title: { absolute: "Admin panel — Gazdinstvo Stojković" },
  robots: { index: false, follow: false },
};

const groupTitle =
  "max-md:w-full px-[12px] pt-[20px] pb-[6px] text-[12px] tracking-[0.12em] text-muted uppercase";

function Login() {
  return (
    <main className="admin mx-auto box-content max-w-[360px] px-[24px] py-[96px]">
      <h1 className="mb-[24px] text-[28px]">Admin panel</h1>
      {isAdminConfigured() ? (
        <LoginForm />
      ) : (
        <p className="text-muted">
          Prijava nije podešena. Upišite ADMIN_USERNAME i ADMIN_PASSWORD u .env.local i ponovo
          pokrenite server.
        </p>
      )}
    </main>
  );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Bez prijave se umesto bilo koje stranice panela prikazuje samo forma za prijavu.
  // Svaka stranica i akcija uz to sama proverava prijavu (requireAdmin).
  if (!(await isAdmin())) return <Login />;

  const [pages, orders] = await Promise.all([getPages(), getOrders()]);
  const waiting = orders.filter((order) => order.status === "nova").length;

  return (
    <div className="admin flex min-h-screen flex-col bg-band md:flex-row">
      <aside className="flex shrink-0 flex-col border-line bg-paper p-[16px] max-md:border-b md:w-[248px] md:border-r">
        <div className="px-[12px] pb-[12px] text-[17px] font-medium">Stojković · admin</div>
        <nav className="flex flex-col gap-[2px] max-md:flex-row max-md:flex-wrap">
          <NavLink href={ADMIN_PATH} exact>
            Pregled
          </NavLink>
          <NavLink href={`${ADMIN_PATH}/porudzbine`}>
            Porudžbine
            {waiting > 0 && (
              <span className="rounded-full bg-brass px-[8px] text-[12px] leading-[20px] text-paper">
                {waiting}
              </span>
            )}
          </NavLink>

          <div className={groupTitle}>Prodavnica</div>
          <NavLink href={`${ADMIN_PATH}/proizvodi`}>Proizvodi</NavLink>
          <NavLink href={`${ADMIN_PATH}/kolekcije`}>Kolekcije</NavLink>
          <NavLink href={`${ADMIN_PATH}/filteri`}>Filteri</NavLink>
          <NavLink href={`${ADMIN_PATH}/popusti`}>Popusti</NavLink>

          <div className={groupTitle}>Stranice</div>
          {builtInPages.map((page) => (
            <NavLink key={page.id} href={`${ADMIN_PATH}/stranice/${page.id}`}>
              {page.title}
            </NavLink>
          ))}
          {pages.map((page) => (
            <NavLink key={page.slug} href={`${ADMIN_PATH}/stranice/${page.slug}`}>
              {page.title}
            </NavLink>
          ))}
          <NavLink href={`${ADMIN_PATH}/stranice/nova`}>+ Nova stranica</NavLink>

          <div className={groupTitle}>Podešavanja</div>
          <NavLink href={`${ADMIN_PATH}/podesavanja`}>Opšte</NavLink>
        </nav>

        <div className="mt-[16px] flex flex-col gap-[2px] border-t border-line pt-[12px] max-md:flex-row md:mt-auto">
          <Link
            href="/"
            target="_blank"
            className="flex min-h-[40px] items-center rounded-[6px] px-[12px] text-[15px] hover:bg-band hover:text-ink"
          >
            Otvori sajt ↗
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-[40px] w-full cursor-pointer items-center rounded-[6px] px-[12px] text-[15px] hover:bg-band"
            >
              Odjavi se
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 grow px-[24px] py-[32px] md:px-[40px]">
        <div className="max-w-[1040px]">{children}</div>
      </main>
    </div>
  );
}
