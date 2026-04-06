export function generateAbbreviation(siteName: string): string {
  // Remove common Turkish words, take first 3 consonant-rich characters
  const cleaned = siteName
    .toUpperCase()
    .replace(/[^A-ZÇĞİÖŞÜ]/g, "")
    .slice(0, 3);
  return cleaned || siteName.slice(0, 3).toUpperCase();
}

export function getSerialNo(abbreviation: string, year: number): string {
  return `${abbreviation}-${year}`;
}

export function formatSequenceNo(seq: number): string {
  return String(seq).padStart(4, "0");
}

export function buildReceiptNo(abbreviation: string, year: number, seq: number): string {
  return `${abbreviation}-${year}-${formatSequenceNo(seq)}`;
}
