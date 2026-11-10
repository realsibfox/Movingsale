/*
 * ─────────────────────────────────────────────────────────────
 *  SALE SETTINGS — the only file you (or Claude) need to edit.
 *  Anything between quotes "like this" can be changed.
 * ─────────────────────────────────────────────────────────────
 */
window.SALE_CONFIG = {
  // Link to the Google Sheet, published as CSV (see SETUP-GUIDE.md, step 4).
  // Leave empty ("") to show sample items as a preview.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRupavB0JqvDETS3W-82aCu8cnfZC0bJakFLMbejNnTRo6J_ALnwf-NSCt_ZrCQwUH_CTHv6qkSVZJv/pub?output=csv",

  // Your WhatsApp number in international format, digits only.
  // Mexico example: "5215512345678"   USA example: "15551234567"
  whatsappNumber: "",

  // Currency symbol shown before prices (prices are in Mexican pesos).
  currencySymbol: "$",

  // Site title in both languages.
  title: { en: "Moving Sale", es: "Venta por mudanza" },

  // Short line under the title (optional — use "" to hide).
  intro: {
    en: "Everything must go! Browse by category, then message me on WhatsApp.",
    es: "¡Todo se tiene que ir! Busca por categoría y escríbeme por WhatsApp.",
  },

  // Areas of the city where you can meet buyers.
  meetAreas: ["Huayapam", "Volcanes", "Reforma", "Macroplaza"],

  // How you accept payment.
  payment: { en: "Cash or bank transfer", es: "Efectivo o transferencia" },

  // Last day of the sale, written as YYYY-MM-DD (optional — use "" to hide).
  endDate: "",

  // Extra rules, one per line (optional). Example:
  // { en: "Items are sold as-is.", es: "Los artículos se venden tal como están." },
  extraRules: [],

  // Order of the category buttons. Categories not listed here appear after these.
  categoryOrder: ["Furniture", "Kitchen", "Clothing", "Home & Linens", "Electronics", "Decor", "Other"],
};
