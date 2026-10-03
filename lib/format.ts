/** 1250 → "1.250". Ručno, da server i pregledač uvek daju isti zapis. */
function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Iznos u RSD; dok vrednost nije poznata, ostaje placeholder iz dizajna. */
export function formatPrice(value: number | null, placeholder = "[CENA]"): string {
  return `${value === null ? placeholder : formatNumber(value)} RSD`;
}

export function formatWeight(value: number | null): string {
  return `${value === null ? "[GRAMAŽA]" : formatNumber(value)} g`;
}

/** 1 komad, 2 komada, 5 komada, 21 komad. */
export function formatPieces(count: number): string {
  const one = count % 10 === 1 && count % 100 !== 11;
  return `${count} ${one ? "komad" : "komada"}`;
}

/** 1 proizvod, 2 proizvoda, 8 proizvoda, 21 proizvod. */
export function formatProductCount(count: number): string {
  const one = count % 10 === 1 && count % 100 !== 11;
  return `${count} ${one ? "proizvod" : "proizvoda"}`;
}
