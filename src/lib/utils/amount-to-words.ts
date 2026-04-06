const ones = [
  "", "BİR", "İKİ", "ÜÇ", "DÖRT", "BEŞ", "ALTI", "YEDİ", "SEKİZ", "DOKUZ",
];
const tens = [
  "", "ON", "YİRMİ", "OTUZ", "KIRK", "ELLİ", "ALTMIŞ", "YETMİŞ", "SEKSEN", "DOKSAN",
];

function threeDigitsToWords(n: number): string {
  if (n === 0) return "";
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const tensDigit = Math.floor(remainder / 10);
  const onesDigit = remainder % 10;

  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "YÜZ" : `${ones[hundreds]} YÜZ`);
  }
  if (tensDigit > 0) parts.push(tens[tensDigit]);
  if (onesDigit > 0) parts.push(ones[onesDigit]);

  return parts.join(" ");
}

export function amountToWords(amount: number): string {
  if (isNaN(amount) || amount < 0) return "";

  const lira = Math.floor(amount);
  const kurus = Math.round((amount - lira) * 100);

  const groups = [
    { value: Math.floor(lira / 1_000_000_000), suffix: "MİLYAR" },
    { value: Math.floor((lira % 1_000_000_000) / 1_000_000), suffix: "MİLYON" },
    { value: Math.floor((lira % 1_000_000) / 1_000), suffix: "BİN" },
    { value: lira % 1_000, suffix: "" },
  ];

  const liraParts: string[] = [];
  groups.forEach(({ value, suffix }) => {
    if (value === 0) return;
    const words = threeDigitsToWords(value);
    if (suffix === "BİN" && value === 1) {
      liraParts.push("BİN");
    } else {
      liraParts.push(suffix ? `${words} ${suffix}` : words);
    }
  });

  const liraText = liraParts.length > 0 ? liraParts.join(" ") + " TÜRK LİRASI" : "SIFIR TÜRK LİRASI";

  if (kurus === 0) return liraText;

  const kurusText = threeDigitsToWords(kurus) + " KURUŞ";
  return `${liraText} ${kurusText}`;
}
