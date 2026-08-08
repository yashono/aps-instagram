const PRICE_LIST_PATTERNS = [
  /price\s*list/i,
  /pricelist/i,
  /rate\s*list/i,
  /ratelist/i,
  /catalog+ue?/i,
  /catalogue/i,
  /price\s*pdf/i,
  /pdf\s*(price|rate|catalog)/i,
  /price\s*chart/i,
  /send\s*(me\s*)?(the\s*)?(price\s*list|catalog+ue?|pdf)/i,
  /catalog\s*bhej/i,
  /catalogue\s*bhej/i,
  /price\s*list\s*bhej/i,
  /pdf\s*bhej/i,
  /list\s*bhej/i,
  /भाव\s*सूची/,
  /मूल्य\s*सूची/,
  /कैटलॉग/,
  /केटलॉग/,
];

export const CATALOG_FILENAME = "APS-Catalog-2026.pdf";
export const CATALOG_PUBLIC_PATH = `/files/${CATALOG_FILENAME}`;

export function wantsPriceList(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }
  return PRICE_LIST_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function catalogMessage(): string {
  return "APS Catalog / Price List 2026 PDF chat mein file ki tarah attach ho gayi hai. Neeche PDF file open karke dekho (blue website link nahi). Exact quote ke liye product, size, aur quantity bata dena.";
}

export function catalogSendFailedMessage(): string {
  return "Catalog PDF abhi attach nahi ho paayi. Please call/WhatsApp karein: +91-9459452277 — hum turant price list share kar denge.";
}
