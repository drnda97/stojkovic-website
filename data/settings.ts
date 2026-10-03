/**
 * Opšta podešavanja sajta koja se menjaju u admin panelu: izgled i email.
 * Ovde su tipovi i početne vrednosti; sačuvane vrednosti su u storage/content.json.
 */

export type ThemeColors = {
  /** Pozadina sajta. */
  paper: string;
  /** Pozadina traka i istaknutih delova. */
  band: string;
  /** Tekst, dugmad i podnožje. */
  ink: string;
  /** Akcenat: natpisi iznad naslova, linkovi pod mišem. */
  brass: string;
};

/** Boje iz dizajna; iste su i u app/globals.css. */
export const defaultColors: ThemeColors = {
  paper: "#f6f1e7",
  band: "#efe8da",
  ink: "#1e1b16",
  brass: "#7a5c25",
};

export const colorLabels: Record<keyof ThemeColors, string> = {
  paper: "Pozadina",
  band: "Pozadina traka",
  ink: "Tekst i dugmad",
  brass: "Akcenat",
};

/** Fontovi koje sajt učitava (lib/fonts.ts); `variable` je CSS promenljiva tog fonta. */
export const fontOptions = [
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    variable: "--font-cormorant",
    fallback: "Georgia, serif",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    variable: "--font-playfair",
    fallback: "Georgia, serif",
  },
  {
    id: "lora",
    label: "Lora",
    variable: "--font-lora",
    fallback: "Georgia, serif",
  },
  {
    id: "jost",
    label: "Jost",
    variable: "--font-jost",
    fallback: "system-ui, sans-serif",
  },
  {
    id: "inter",
    label: "Inter",
    variable: "--font-inter",
    fallback: "system-ui, sans-serif",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    variable: "--font-montserrat",
    fallback: "system-ui, sans-serif",
  },
  {
    id: "open-sans",
    label: "Open Sans",
    variable: "--font-open-sans",
    fallback: "system-ui, sans-serif",
  },
] as const;

export type FontId = (typeof fontOptions)[number]["id"];

export type MailSettings = {
  /** Email prodavcu za svaku novu porudžbinu. */
  notifySeller: boolean;
  /** Potvrda kupcu, ako je pri poručivanju upisao email. */
  notifyCustomer: boolean;
  /** Adresa na koju stižu porudžbine. */
  sellerEmail: string;
  /** Ime i adresa pošiljaoca. */
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  /** true: koristi se šablon koji je vlasnik ubacio (storage/email-template.html). */
  customTemplate: boolean;
};

export type Settings = {
  colors: ThemeColors;
  headingFont: FontId;
  bodyFont: FontId;
  /** Putanje do ubačenih slika; bez njih važe natpis „Stojković" i public/icon.svg. */
  logo?: string;
  favicon?: string;
  mail: MailSettings;
};

export const defaultSettings: Settings = {
  colors: defaultColors,
  headingFont: "cormorant",
  bodyFont: "jost",
  mail: {
    notifySeller: true,
    notifyCustomer: true,
    sellerEmail: "",
    fromName: "Gazdinstvo Stojković",
    fromEmail: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    customTemplate: false,
  },
};

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Mešavina dve hex boje; `share` je udeo druge (0–1). */
export function mixColors(first: string, second: string, share: number): string {
  const channel = (hex: string, index: number) =>
    parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
  return `#${[0, 1, 2]
    .map((index) =>
      Math.round(channel(first, index) * (1 - share) + channel(second, index) * share)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function fontStack(id: FontId): string {
  const font = fontOptions.find((option) => option.id === id) ?? fontOptions[0];
  return `var(${font.variable}), ${font.fallback}`;
}

/**
 * CSS koji preko tokena iz app/globals.css stavlja izabrane boje i fontove.
 * Dok je sve na početnim vrednostima vraća prazan tekst, pa važi dizajn iz globals.css.
 * Linije, prigušeni tekst i ostale nijanse izvode se iz četiri izabrane boje.
 */
export function themeCss(settings: Settings): string {
  const rules: string[] = [];
  const { paper, band, ink, brass } = settings.colors;

  const customColors = (Object.keys(defaultColors) as (keyof ThemeColors)[]).some(
    (key) => settings.colors[key].toLowerCase() !== defaultColors[key],
  );
  if (customColors) {
    rules.push(
      `--color-paper:${paper}`,
      `--color-band:${band}`,
      `--color-ink:${ink}`,
      `--color-brass:${brass}`,
      `--color-field:${mixColors(paper, "#ffffff", 0.45)}`,
      `--color-ph:${mixColors(paper, ink, 0.08)}`,
      `--color-ph-dark:${mixColors(paper, ink, 0.12)}`,
      `--color-muted:${mixColors(ink, paper, 0.3)}`,
      `--color-brass-light:${mixColors(brass, paper, 0.6)}`,
      `--color-line:${mixColors(paper, ink, 0.12)}`,
      `--color-line-mid:${mixColors(paper, ink, 0.18)}`,
      `--color-line-strong:${mixColors(paper, ink, 0.27)}`,
      `--color-line-dark:${mixColors(ink, paper, 0.14)}`,
      `--color-footer-text:${mixColors(paper, ink, 0.18)}`,
    );
  }
  if (settings.headingFont !== defaultSettings.headingFont) {
    rules.push(`--font-serif:${fontStack(settings.headingFont)}`);
  }
  if (settings.bodyFont !== defaultSettings.bodyFont) {
    rules.push(`--font-sans:${fontStack(settings.bodyFont)}`);
  }
  return rules.length > 0 ? `:root{${rules.join(";")}}` : "";
}
