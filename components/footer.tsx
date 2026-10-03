import Link from "next/link";
import { site } from "@/data/site";

const columnTitle = "mb-[8px] text-[12px] tracking-[0.2em] text-brass-light uppercase";
const link = "py-[6px] hover:text-brass-light";

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto box-content flex max-w-site flex-col gap-[56px] px-[32px] pt-[72px] pb-[32px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-x-[48px] gap-y-[40px]">
          <div className="flex flex-col gap-[12px]">
            <div className="font-serif text-[28px] font-medium tracking-[0.12em] uppercase">
              Stojković
            </div>
            <p className="text-[15px] text-footer-text">
              Poljoprivredno gazdinstvo. Domaći kozji sirevi sa začinima, ručna proizvodnja.
            </p>
          </div>
          <div className="flex flex-col gap-[4px] text-[15px]">
            <div className={columnTitle}>Prodavnica</div>
            <Link href="/sirevi" className={link}>
              Svi sirevi
            </Link>
            <Link href="/o-nama" className={link}>
              O nama
            </Link>
            <Link href="/cesta-pitanja" className={link}>
              Česta pitanja
            </Link>
          </div>
          <div className="flex flex-col gap-[4px] text-[15px]">
            <div className={columnTitle}>Kontakt</div>
            <div className="py-[6px]">{site.phone}</div>
            <div className="py-[6px]">{site.email}</div>
            <a href={site.instagramUrl} className={link}>
              {site.instagramLabel}
            </a>
          </div>
          <div className="flex flex-col gap-[4px] text-[15px]">
            <div className={columnTitle}>Dostava</div>
            <p className="py-[6px] text-footer-text">
              Šaljemo kurirskom službom širom Srbije. Plaćanje pouzećem.
            </p>
          </div>
        </div>
        <div className="border-t border-line-dark pt-[24px] text-[13px] text-footer-text">
          © 2026 Poljoprivredno gazdinstvo Stojković · {site.place}
        </div>
      </div>
    </footer>
  );
}
