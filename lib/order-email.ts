import path from "node:path";
import nodemailer from "nodemailer";
import type { Settings } from "@/data/settings";
import { site } from "@/data/site";
import { getSettings, getStoredValue, setStoredValue, uploadPath } from "@/lib/content";
import { defaultEmailTemplate } from "@/lib/email-template";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/orders";

/**
 * Email o porudžbini: prodavcu obaveštenje, kupcu potvrda. Šalje se preko
 * SMTP naloga upisanog u admin panelu (Podešavanja). Samo za server.
 */

export type Recipient = "seller" | "customer";

/** Ime zapisa u tabeli settings pod kojim je šablon koji je vlasnik ubacio. */
const TEMPLATE_KEY = "email_template";
export const MAX_TEMPLATE_BYTES = 300 * 1024;
const LOGO_CID = "logo@stojkovic";

export async function saveCustomTemplate(html: string) {
  await setStoredValue(TEMPLATE_KEY, html);
}

export async function removeCustomTemplate() {
  await setStoredValue(TEMPLATE_KEY, null);
}

/** Šablon koji je vlasnik ubacio, ili naš ako svog nema. */
export async function getEmailTemplate(settings: Settings): Promise<string> {
  if (!settings.mail.customTemplate) return defaultEmailTemplate;
  return (await getStoredValue(TEMPLATE_KEY)) ?? defaultEmailTemplate;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function amount(value: number | null): string {
  return value === null ? "—" : formatPrice(value);
}

/** Vrednosti iz data/site.ts koje još nisu upisane stoje u uglastim zagradama i ne idu u email. */
function known(value: string): string | null {
  return value.startsWith("[") ? null : value;
}

const dateFormat = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Belgrade",
});

type RenderInput = {
  template: string;
  order: Order;
  recipient: Recipient;
  settings: Settings;
  /** Adresa slike logoa: `cid:` prilog pri slanju, javna putanja u pregledu. */
  logoSrc?: string;
};

export function renderOrderEmail({ template, order, recipient, settings, logoSrc }: RenderInput) {
  const { customer } = order;
  const callback = known(site.callbackTime);
  const title = recipient === "seller" ? "Nova porudžbina" : "Hvala, porudžbina je primljena.";
  const message =
    recipient === "seller"
      ? "Stigla je nova porudžbina sa sajta. Pozovite kupca da potvrdite porudžbinu i dan slanja."
      : `Javićemo se telefonom${callback ? ` u toku ${callback}` : ""} da potvrdimo porudžbinu i dan slanja. Ništa ne plaćate sada — iznos plaćate kuriru pri preuzimanju.`;
  const contact = [known(site.phone), known(site.email) ?? settings.mail.sellerEmail]
    .filter(Boolean)
    .join(" · ");
  const address = `${customer.street}, ${customer.postalCode} ${customer.city}`;

  // Kod za sledeću kupovinu: kupcu istaknut okvir, prodavcu samo napomena da je poslat.
  const { colors } = settings;
  const issued = order.issuedCode;
  let discountBlock = "";
  if (issued && recipient === "customer") {
    discountBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:2px dashed ${colors.brass};"><tr><td align="center" style="padding:18px 20px;font-size:15px;color:${colors.ink};"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${colors.brass};">Poklon za sledeću kupovinu</div><div style="padding:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;">${escapeHtml(issued.title)}</div><div style="padding:2px 0;font-size:17px;">${issued.percent}% popusta</div><div style="padding:6px 0;"><span style="display:inline-block;padding:8px 16px;background:${colors.ink};color:${colors.paper};font-family:'Courier New',monospace;font-size:20px;letter-spacing:3px;">${escapeHtml(issued.code)}</span></div><div>Upišite kod u korpi pri sledećoj porudžbini. Važi za jednu kupovinu, uz isti email ili telefon.</div></td></tr></table>`;
  } else if (issued) {
    discountBlock = `<p style="margin:16px 0 0;font-size:15px;">Kupcu je uz potvrdu poslat kod <strong>${escapeHtml(issued.code)}</strong> za ${issued.percent}% popusta pri sledećoj kupovini.</p>`;
  }
  const discountRow = order.discount
    ? `<tr><td style="padding:2px 0;">Popust ${order.discount.percent}% (kod ${escapeHtml(order.discount.code)})</td><td align="right" style="padding:2px 0;white-space:nowrap;">−${amount(order.discount.amount)}</td></tr>`
    : "";

  // Sve što dolazi od kupca prolazi kroz escapeHtml; gotov HTML su {{stavke}}, {{logo}}, {{popust}} i {{red_popusta}}.
  const values: Record<string, string> = {
    naslov: escapeHtml(title),
    poruka: escapeHtml(message),
    logo: logoSrc
      ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(site.name)}" height="56" style="height:56px;width:auto;max-width:240px;border:0;">`
      : `<span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:3px;text-transform:uppercase;">${escapeHtml(site.name)}</span>`,
    naziv_sajta: escapeHtml(site.name),
    broj: escapeHtml(order.number),
    datum: escapeHtml(dateFormat.format(new Date(order.receivedAt))),
    stavke: order.items
      .map(
        (item) =>
          `<tr><td style="padding:6px 0;">${item.qty} × ${escapeHtml(item.name)}</td><td align="right" style="padding:6px 0;white-space:nowrap;">${amount(item.price === null ? null : item.price * item.qty)}</td></tr>`,
      )
      .join("\n"),
    medjuzbir: amount(order.subtotal),
    red_popusta: discountRow,
    popust: discountBlock,
    naslov_popusta: escapeHtml(issued?.title ?? ""),
    kod_popusta: escapeHtml(issued?.code ?? ""),
    procenat_popusta: issued ? String(issued.percent) : "",
    dostava: amount(order.delivery),
    ukupno: amount(order.total),
    ime: escapeHtml(customer.name),
    telefon: escapeHtml(customer.phone),
    email: escapeHtml(customer.email || "—"),
    adresa: escapeHtml(address),
    napomena: escapeHtml(customer.note || "—"),
    kontakt: escapeHtml(contact),
    boja_pozadine: settings.colors.paper,
    boja_trake: settings.colors.band,
    boja_teksta: settings.colors.ink,
    boja_akcenta: settings.colors.brass,
  };
  const html = template.replace(
    /\{\{\s*([a-z_]+)\s*\}\}/g,
    (_match, key: string) => values[key] ?? "",
  );

  const text = [
    title,
    "",
    message,
    "",
    `Porudžbina br. ${order.number} · ${dateFormat.format(new Date(order.receivedAt))}`,
    "",
    ...order.items.map(
      (item) =>
        `${item.qty} × ${item.name} — ${amount(item.price === null ? null : item.price * item.qty)}`,
    ),
    `Međuzbir: ${amount(order.subtotal)}`,
    ...(order.discount
      ? [
          `Popust ${order.discount.percent}% (kod ${order.discount.code}): −${amount(order.discount.amount)}`,
        ]
      : []),
    `Dostava: ${amount(order.delivery)}`,
    `Za naplatu, pouzećem: ${amount(order.total)}`,
    ...(issued
      ? [
          "",
          recipient === "customer"
            ? `Poklon za sledeću kupovinu — ${issued.title}: ${issued.percent}% popusta. Kod: ${issued.code} (važi za jednu kupovinu, uz isti email ili telefon).`
            : `Kupcu je poslat kod ${issued.code} za ${issued.percent}% popusta pri sledećoj kupovini.`,
        ]
      : []),
    "",
    customer.name,
    address,
    customer.phone,
    ...(customer.email ? [customer.email] : []),
    ...(customer.note ? [`Napomena: ${customer.note}`] : []),
    "",
    site.name,
    contact,
  ].join("\n");

  const subject =
    recipient === "seller"
      ? `Nova porudžbina #${order.number} — ${customer.name}`
      : `Porudžbina #${order.number} je primljena — ${site.name}`;

  return { subject, html, text };
}

/** Porudžbina za pregled šablona i probni email. */
export function sampleOrder(): Order {
  return {
    number: "1001",
    receivedAt: new Date().toISOString(),
    status: "nova",
    customer: {
      name: "Petar Petrović",
      phone: "064 123 4567",
      email: "petar@primer.rs",
      street: "Glavna 12",
      city: "Niš",
      postalCode: "18000",
      note: "Interfon 5, posle 17 h",
    },
    items: [
      {
        slug: "klasican-kozji-sir",
        name: "Klasičan kozji sir",
        qty: 2,
        price: 950,
      },
      {
        slug: "kozji-sir-sa-maslinama",
        name: "Kozji sir sa maslinama",
        qty: 1,
        price: 1050,
      },
    ],
    subtotal: 2950,
    delivery: 450,
    total: 3105,
    discount: { code: "SIR-PRIMER", percent: 10, amount: 295 },
    issuedCode: { code: "SIR15", percent: 15, title: "Hvala na velikoj porudžbini" },
  };
}

export function isMailConfigured(settings: Settings): boolean {
  return settings.mail.smtpHost !== "";
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Šalje emailove o porudžbini prema podešavanjima. Vraća opis greške, ili
 * null kada je sve poslato. Proba (`test`) šalje obe varijante na adresu prodavca.
 */
async function send(order: Order, settings: Settings, test: boolean): Promise<string | null> {
  const { mail } = settings;
  const transport = nodemailer.createTransport({
    host: mail.smtpHost,
    port: mail.smtpPort,
    // Port 465 šifruje vezu od početka; ostali prelaze na šifrovanu kada server to ponudi.
    secure: mail.smtpPort === 465,
    auth: mail.smtpUser ? { user: mail.smtpUser, pass: mail.smtpPassword } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  const template = await getEmailTemplate(settings);
  const logoFile = uploadPath(settings.logo);
  const from = {
    name: mail.fromName || site.name,
    address: mail.fromEmail || mail.smtpUser,
  };

  const messages: { recipient: Recipient; to: string; replyTo?: string }[] = [];
  if (test) {
    messages.push(
      { recipient: "seller", to: mail.sellerEmail },
      { recipient: "customer", to: mail.sellerEmail },
    );
  } else {
    if (mail.notifySeller && mail.sellerEmail) {
      messages.push({
        recipient: "seller",
        to: mail.sellerEmail,
        replyTo: order.customer.email || undefined,
      });
    }
    if (mail.notifyCustomer && order.customer.email) {
      messages.push({
        recipient: "customer",
        to: order.customer.email,
        replyTo: mail.sellerEmail || undefined,
      });
    }
  }

  const errors: string[] = [];
  for (const message of messages) {
    const { subject, html, text } = renderOrderEmail({
      template,
      order,
      recipient: message.recipient,
      settings,
      logoSrc: logoFile ? `cid:${LOGO_CID}` : undefined,
    });
    try {
      await transport.sendMail({
        from,
        to: message.to,
        replyTo: message.replyTo,
        subject: test ? `[Proba] ${subject}` : subject,
        html,
        text,
        // Logo ide kao prilog u poruci, pa se vidi i kada program za email blokira slike sa interneta.
        attachments: logoFile
          ? [
              {
                filename: path.basename(logoFile),
                path: logoFile,
                cid: LOGO_CID,
              },
            ]
          : [],
      });
    } catch (error) {
      errors.push(`${message.recipient === "seller" ? "prodavcu" : "kupcu"}: ${errorText(error)}`);
    }
  }
  transport.close();
  return errors.length > 0 ? errors.join(" · ") : null;
}

export async function notifyOrder(order: Order): Promise<string | null> {
  const settings = await getSettings();
  if (!isMailConfigured(settings)) return null;
  return send(order, settings, false);
}

/** Probna poruka: obe varijante (za prodavca i za kupca) stižu na adresu prodavca. */
export async function sendTestEmail(): Promise<string | null> {
  const settings = await getSettings();
  if (!isMailConfigured(settings)) return "Upišite i sačuvajte SMTP server pre slanja probe.";
  if (!settings.mail.sellerEmail) return "Upišite i sačuvajte svoju email adresu pre slanja probe.";
  return send(sampleOrder(), settings, true);
}
