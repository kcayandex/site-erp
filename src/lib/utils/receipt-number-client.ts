// Client-safe version (no server imports)
export function generateAbbreviation(siteName: string): string {
  const upper = siteName.toUpperCase().replace(/[^A-ZÇĞİÖŞÜ]/g, '')
  return upper.slice(0, 3) || 'SIT'
}
