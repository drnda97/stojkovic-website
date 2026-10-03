import type { Metadata } from "next";
import { AccordionItem } from "@/components/accordion";
import { site } from "@/data/site";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Česta pitanja",
  description:
    "Sve o poručivanju, dostavi i samom siru: kako se plaća, gde i kada šaljemo, koliko sir traje i šta je u njemu.",
};

const questions = [
  {
    question: "Kako se poručuje i plaća?",
    answer:
      "Dodate sireve u korpu, ostavite ime, adresu i telefon, i to je sve — nalog nije potreban. Plaćate pouzećem, gotovinom kuriru kada paket stigne. Online plaćanje karticom za sada nemamo.",
  },
  {
    question: "Gde i kada šaljete?",
    answer: `Šaljemo kurirskom službom na teritoriji cele Srbije. Pakete predajemo ${site.shippingDays}, da sir ne bi čekao vikend u magacinu. Isporuka obično traje ${site.deliveryTime} radna dana.`,
  },
  {
    question: "Koliko košta dostava?",
    answer: `Dostava je ${formatPrice(site.deliveryPrice, "[CENA DOSTAVE]")}. Za porudžbine preko ${formatPrice(site.freeDeliveryFrom, "[IZNOS]")} dostava je besplatna.`,
  },
  {
    question: "Kako sir stiže, da li ostaje svež?",
    answer:
      "Svaki komad je vakuumiran, a paket ide sa rashladnim ulošcima. Čim stigne, stavite sir u frižider.",
  },
  {
    question: "Koliko dugo sir traje?",
    answer: `Neotvoren, u frižideru na 2–6 °C, traje do datuma na etiketi — ${site.shelfLife}. Posle otvaranja držite ga umotanog u papir za pečenje ili u zatvorenoj posudi i potrošite za ${site.useWithinDays} dana.`,
  },
  {
    question: "Da li je kozji sir bez laktoze?",
    answer:
      "Nije. Kozje mleko sadrži laktozu, tek nešto manje nego kravlje, a zrenjem je u siru ostaje još manje. Mnogi ga lakše podnose, ali ako imate intoleranciju na laktozu ili alergiju na mleko, posavetujte se sa lekarom.",
  },
  {
    question: "Po čemu se razlikuje od kravljeg sira?",
    answer:
      "Prirodno je beo, kremastiji i blago pikantan. Ukus dolazi od masnih kiselina kojih u kozjem mleku ima više. Kod svežeg, dobro pravljenog sira taj ukus je čist i blag, bez oštrog mirisa.",
  },
  {
    question: "Šta sve ima u siru?",
    answer:
      "Kozje mleko, sirilo i so. Kod sireva sa ukusima još i začin koji piše u nazivu: aleva paprika, masline, začinsko bilje, biber. Bez konzervansa, boja i veštačkih aroma.",
  },
  {
    question: "Mogu li da poručim veću količinu ili poklon paket?",
    answer:
      "Možete. Za slavlja, restorane i poklone javite se telefonom ili porukom na Instagramu, pa ćemo se dogovoriti o količini i roku.",
  },
];

export default function FaqPage() {
  return (
    <section className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-x-[80px] gap-y-[48px] px-[32px] pt-[72px] pb-[96px]">
      <div className="flex flex-col gap-[16px]">
        <div className="text-[12px] tracking-[0.2em] text-brass uppercase">Pomoć</div>
        <h1 className="text-[length:clamp(44px,5.5vw,72px)] leading-[1.05]">Česta pitanja</h1>
        <p className="max-w-[24em] text-muted">
          Sve o poručivanju, dostavi i samom siru. Ako ne nađete odgovor, pozovite nas ili pišite.
        </p>
        <div className="mt-[16px] flex flex-col gap-[2px] border-t border-ink pt-[20px] text-[16px]">
          <div>{site.phone}</div>
          <div>{site.email}</div>
          <a href={site.instagramUrl} className="py-[4px]">
            {site.instagramLabel}
          </a>
        </div>
      </div>

      <div className="border-t border-ink">
        {questions.map((item, index) => (
          <AccordionItem
            key={item.question}
            title={item.question}
            variant="faq"
            defaultOpen={index === 0}
          >
            {item.answer}
          </AccordionItem>
        ))}
      </div>
    </section>
  );
}
