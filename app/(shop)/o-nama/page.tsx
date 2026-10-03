import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/placeholder";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "O nama",
  description:
    "Malo gazdinstvo, koze i sir koji pravimo sami: mleko od sopstvenih koza, sirenje istog dana, ručno soljenje i pravi začini.",
};

const eyebrow = "text-[12px] tracking-[0.2em] text-brass uppercase";

const reasons = [
  {
    title: "Prirodno beo",
    text: "Koze karoten iz trave pretvaraju u vitamin A, pa u mleku ne ostaje žuti pigment. Zato je kozji sir snežno beo, bez ikakvog beljenja.",
  },
  {
    title: "Kremast i blago pikantan",
    text: "Kozje mleko ima više kratkih i srednjih masnih kiselina. One siru daju onaj prepoznatljiv, blago kiselkast i pikantan ukus.",
  },
  {
    title: "Sitnije masne kapljice",
    text: "Mast u kozjem mleku je u sitnijim kapljicama nego u kravljem. Mnogima je zato kozji sir lakši za stomak.",
  },
];

const steps = [
  {
    title: "Mleko",
    text: "Muzemo ujutru i uveče. Mleko ide u siranu istog dana, ne putuje i ne čeka.",
  },
  {
    title: "Sirenje",
    text: "Mleko se podsiri, gruš se seče i polako cedi u kalupima, bez presovanja na silu.",
  },
  {
    title: "So i začini",
    text: "Svaki kolut se soli ručno. Aleva paprika, masline, bilje i biber dodaju se u siranu, ne u fabrici.",
  },
  {
    title: "Pakovanje",
    text: "Sir se vakuumira i šalje u rashladnom pakovanju, da stigne onakav kakav je izašao iz sirane.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto box-content flex max-w-site flex-col gap-[20px] px-[32px] pt-[88px] pb-[64px]">
        <div className={eyebrow}>O nama</div>
        <h1 className="max-w-[12em] text-[length:clamp(44px,6vw,84px)] leading-[1.02] text-balance">
          Malo gazdinstvo, koze i sir koji pravimo sami.
        </h1>
      </section>

      <div className="mx-auto box-content max-w-site px-[32px]">
        <Placeholder
          label="Fotografija · imanje i stado, široki kadar"
          src="/slike/imanje-i-stado.jpg"
          sizes="(min-width: 1264px) 1200px, 100vw"
          className="aspect-[21/9]"
        />
      </div>

      <section className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-x-[80px] gap-y-[40px] px-[32px] py-[96px]">
        <h2 className="text-[length:clamp(32px,3.6vw,46px)] leading-[1.12] text-balance">
          Priroda dobrih ukusa nije slogan. To je redosled kojim radimo.
        </h2>
        <div className="flex flex-col gap-[20px] text-muted">
          <p>
            Poljoprivredno gazdinstvo Stojković nalazi se u {site.place}. Koze držimo od{" "}
            {site.since} godine, a sir smo počeli da pravimo prvo za kuću i komšije. Kada su ljudi
            počeli da se vraćaju po još, napravili smo malu siranu.
          </p>
          <p>
            I dalje radimo isto kao na početku: mleko od sopstvenih koza, sirenje istog dana, ručno
            soljenje i začini koje bismo i sami stavili na sto. Ne pravimo velike količine, i ne
            planiramo.
          </p>
          <p>
            [OVDE IDE VAŠA LIČNA PRIČA — ko vodi gazdinstvo, koliko koza imate, koja rasa, šta vam
            je najvažnije.]
          </p>
        </div>
      </section>

      <section className="bg-band">
        <div className="mx-auto box-content max-w-site px-[32px] py-[96px]">
          <div className="mb-[48px] flex flex-col gap-[10px]">
            <div className={eyebrow}>Zašto kozji sir</div>
            <h2 className="text-[length:clamp(32px,3.6vw,46px)] leading-[1.1]">
              Drugačije mleko, drugačiji sir
            </h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-x-[48px] gap-y-[40px]">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="flex flex-col gap-[10px] border-t border-ink pt-[20px]"
              >
                <h3 className="text-[26px]">{reason.title}</h3>
                <p className="text-[16px] text-muted">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto box-content grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-[64px] px-[32px] py-[96px]">
        <Placeholder
          label="Fotografija · ruke koje oblikuju sir u sirani"
          src="/slike/ruke-u-sirani.jpg"
          className="aspect-[4/5]"
        />
        <div className="flex flex-col gap-[32px]">
          <div className="flex flex-col gap-[10px]">
            <div className={eyebrow}>Kako nastaje</div>
            <h2 className="text-[length:clamp(32px,3.6vw,46px)] leading-[1.1]">
              Od muže do paketa
            </h2>
          </div>
          <div className="flex flex-col">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex gap-[24px] border-t border-line py-[20px] ${index === steps.length - 1 ? "border-b" : ""}`}
              >
                <div className="min-w-[32px] font-serif text-[20px] font-medium text-brass">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-[24px]">{step.title}</h3>
                  <p className="text-[16px] text-muted">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto box-content flex max-w-site flex-col items-center gap-[24px] px-[32px] py-[88px] text-center">
          <h2 className="text-[length:clamp(34px,4vw,52px)] leading-[1.1] text-balance">
            Najbolje se objašnjava na tanjiru.
          </h2>
          <Link
            href="/sirevi"
            className="inline-flex min-h-[52px] items-center justify-center bg-ink px-[32px] text-[14px] tracking-[0.14em] text-paper uppercase hover:bg-brass"
          >
            Pogledaj sireve
          </Link>
        </div>
      </section>
    </>
  );
}
