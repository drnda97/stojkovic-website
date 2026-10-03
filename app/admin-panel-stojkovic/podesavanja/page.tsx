import { colorLabels, fontOptions, type ThemeColors } from "@/data/settings";
import { ADMIN_PATH, requireAdmin } from "@/lib/admin-auth";
import { getSettings } from "@/lib/content";
import { templatePlaceholders } from "@/lib/email-template";
import {
  resetAppearanceAction,
  resetTemplateAction,
  saveAppearanceAction,
  saveMailAction,
  sendTestEmailAction,
  uploadTemplateAction,
} from "../actions";
import {
  buttonClass,
  cardClass,
  Checkbox,
  fileClass,
  IMAGE_ACCEPT,
  inputClass,
  labelClass,
  PageHeader,
  quietButtonClass,
  Thumb,
} from "../ui";

type SettingsPageProps = {
  searchParams: Promise<{ greska?: string; ok?: string }>;
};

const sectionTitle = "text-[20px]";
const sectionHint = "mb-[16px] text-[14px] text-muted";
const groupTitle = "mt-[8px] text-[15px] font-medium";
const twoColumns = "grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-[16px]";
const checkboxLabel = "flex cursor-pointer items-start gap-[10px] text-[15px] leading-[22px]";

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requireAdmin();
  const { greska, ok } = await searchParams;
  // Lozinka za SMTP se namerno ne šalje u formu.
  const { colors, headingFont, bodyFont, logo, favicon, mail } = await getSettings();
  const previewPath = `${ADMIN_PATH}/podesavanja/pregled`;

  return (
    <>
      <PageHeader title="Opšta podešavanja" error={greska} notice={ok} />

      <section className={`${cardClass} max-w-[760px]`}>
        <h2 className={sectionTitle}>Izgled sajta</h2>
        <p className={sectionHint}>
          Boje, fontovi, logo i favicon. Nijanse linija i prigušenog teksta izvode se same iz
          izabranih boja. Pazite da tekst ostane čitljiv na pozadini.
        </p>
        <form action={saveAppearanceAction} className="flex flex-col gap-[16px]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-[16px]">
            {(Object.keys(colorLabels) as (keyof ThemeColors)[]).map((key) => (
              <label key={key} className={labelClass}>
                {colorLabels[key]}
                <input
                  type="color"
                  name={key}
                  defaultValue={colors[key]}
                  className="h-[44px] w-full cursor-pointer rounded-[6px] border border-line-strong bg-white p-[4px]"
                />
              </label>
            ))}
          </div>

          <div className={twoColumns}>
            <label className={labelClass}>
              Font naslova
              <select name="headingFont" defaultValue={headingFont} className={inputClass}>
                {fontOptions.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Font teksta
              <select name="bodyFont" defaultValue={bodyFont} className={inputClass}>
                {fontOptions.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={twoColumns}>
            <div className={labelClass}>
              Logo u zaglavlju (PNG ili WebP providne pozadine, do 56 px visine na sajtu)
              <div className="flex flex-wrap items-center gap-[12px]">
                <Thumb src={logo} alt="Logo" contain />
                <input
                  type="file"
                  name="logo"
                  accept={IMAGE_ACCEPT}
                  aria-label="Logo"
                  className={fileClass}
                />
              </div>
              {logo && (
                <label className="flex cursor-pointer items-center gap-[10px] text-ink">
                  <Checkbox name="logoRemove" />
                  Ukloni logo i vrati natpis
                </label>
              )}
            </div>
            <div className={labelClass}>
              Favicon — sličica u kartici pregledača (kvadratni PNG, bar 64 × 64 px)
              <div className="flex flex-wrap items-center gap-[12px]">
                <Thumb src={favicon ?? "/icon.svg"} alt="Favicon" contain />
                <input
                  type="file"
                  name="favicon"
                  accept={IMAGE_ACCEPT}
                  aria-label="Favicon"
                  className={fileClass}
                />
              </div>
              {favicon && (
                <label className="flex cursor-pointer items-center gap-[10px] text-ink">
                  <Checkbox name="faviconRemove" />
                  Ukloni i vrati podrazumevani
                </label>
              )}
            </div>
          </div>

          <div>
            <button type="submit" className={buttonClass}>
              Sačuvaj izgled
            </button>
          </div>
        </form>
        <form action={resetAppearanceAction} className="mt-[12px]">
          <button type="submit" className={quietButtonClass}>
            Vrati boje i fontove iz dizajna
          </button>
        </form>
      </section>

      <section className={`${cardClass} mt-[16px] max-w-[760px]`}>
        <h2 className={sectionTitle}>Email o porudžbini</h2>
        <p className={sectionHint}>
          Kada neko poruči, sajt šalje email preko vašeg email naloga. Porudžbina se uvek sačuva u
          panelu, i kada slanje ne uspe.
        </p>
        <form action={saveMailAction} className="flex flex-col gap-[16px]">
          <label className={checkboxLabel}>
            <Checkbox name="notifySeller" defaultChecked={mail.notifySeller} />
            Šalji meni email za svaku novu porudžbinu
          </label>
          <label className={checkboxLabel}>
            <Checkbox name="notifyCustomer" defaultChecked={mail.notifyCustomer} />
            <span>
              Šalji kupcu potvrdu porudžbine
              <span className="block text-[14px] text-muted">
                Email je obavezno polje pri poručivanju, pa potvrdu dobija svaki kupac.
              </span>
            </span>
          </label>

          <div className={twoColumns}>
            <label className={labelClass}>
              Vaš email (ovde stižu porudžbine)
              <input
                name="sellerEmail"
                type="email"
                defaultValue={mail.sellerEmail}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Ime pošiljaoca (vidi ga kupac)
              <input name="fromName" defaultValue={mail.fromName} className={inputClass} />
            </label>
          </div>

          <h3 className={groupTitle}>Nalog sa kog se šalje (SMTP)</h3>
          <p className="mt-[-12px] text-[14px] text-muted">
            Podatke daje vaš email provajder ili hosting. Za Gmail: server smtp.gmail.com, port 587,
            korisničko ime je vaša adresa, a lozinka je „lozinka za aplikacije“ iz Google naloga, ne
            vaša obična lozinka.
          </p>
          <div className={twoColumns}>
            <label className={labelClass}>
              SMTP server
              <input
                name="smtpHost"
                defaultValue={mail.smtpHost}
                placeholder="npr. smtp.gmail.com"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Port (587, ili 465 za SSL)
              <input
                name="smtpPort"
                type="number"
                min="1"
                max="65535"
                required
                defaultValue={mail.smtpPort}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Korisničko ime
              <input
                name="smtpUser"
                autoComplete="off"
                defaultValue={mail.smtpUser}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Lozinka
              <input
                name="smtpPassword"
                type="password"
                autoComplete="new-password"
                placeholder={mail.smtpPassword ? "sačuvana — upišite samo ako je menjate" : ""}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Adresa pošiljaoca (ako je prazno, koristi se korisničko ime)
              <input
                name="fromEmail"
                type="email"
                defaultValue={mail.fromEmail}
                className={inputClass}
              />
            </label>
          </div>

          <div>
            <button type="submit" className={buttonClass}>
              Sačuvaj email podešavanja
            </button>
          </div>
        </form>
        <form action={sendTestEmailAction} className="mt-[12px]">
          <button type="submit" className={quietButtonClass}>
            Pošalji probni email na moju adresu
          </button>
        </form>
      </section>

      <section className={`${cardClass} mt-[16px] max-w-[760px]`}>
        <h2 className={sectionTitle}>Šablon emaila</h2>
        <p className={sectionHint}>
          Trenutno se koristi <strong>{mail.customTemplate ? "vaš šablon" : "naš šablon"}</strong>.
          Isti šablon ide i vama i kupcu; razlikuju se naslov i uvodna rečenica. Naš šablon prati
          boje i logo sajta.
        </p>
        <div className="flex flex-wrap gap-[12px]">
          <a href={previewPath} target="_blank" className={quietButtonClass}>
            Pregled: email kupcu ↗
          </a>
          <a href={`${previewPath}?za=prodavac`} target="_blank" className={quietButtonClass}>
            Pregled: email meni ↗
          </a>
          <a href={`${ADMIN_PATH}/podesavanja/sablon`} className={quietButtonClass}>
            Preuzmi naš šablon
          </a>
        </div>

        <form
          action={uploadTemplateAction}
          className="mt-[16px] flex flex-wrap items-end gap-[12px] border-t border-line pt-[16px]"
        >
          <label className={`${labelClass} min-w-[220px] grow`}>
            Vaš šablon (HTML fajl, do 300 KB)
            <input
              type="file"
              name="template"
              accept=".html,.htm,text/html"
              required
              className={`${fileClass} min-h-[44px]`}
            />
          </label>
          <button type="submit" className={buttonClass}>
            Ubaci šablon
          </button>
        </form>
        {mail.customTemplate && (
          <form action={resetTemplateAction} className="mt-[12px]">
            <button type="submit" className={quietButtonClass}>
              Vrati naš šablon
            </button>
          </form>
        )}

        <details className="mt-[16px] border-t border-line pt-[12px] text-[14px]">
          <summary className="cursor-pointer text-[15px]">
            Mesta u šablonu koja se zamenjuju podacima porudžbine
          </summary>
          <table className="mt-[8px] w-full">
            <tbody>
              {templatePlaceholders.map((placeholder) => (
                <tr key={placeholder.key} className="border-t border-line align-top">
                  <td className="py-[6px] pr-[16px] font-mono text-[13px] whitespace-nowrap">
                    {`{{${placeholder.key}}}`}
                  </td>
                  <td className="py-[6px] text-muted">{placeholder.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
    </>
  );
}
