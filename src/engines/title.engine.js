// /src/engines/title.engine.js

function normalize(text) {
  return String(text || "")
    .replace(/[^\w\s\-]/g, " ") // remove symbols
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================
// CLEAN BASE
// ==========================
function cleanNoise(text) {
  return String(text || "")
    .replace(/\b(new|hot|sale|free shipping|dropshipping|\d{4})\b/gi, "")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================
// TOKENIZATION
// ==========================
function tokenize(text) {
  return normalize(text)
    .toLowerCase()
    .split(" ")
    .filter(Boolean);
}

// ==========================
// GENERIC PRODUCT DETECTION (NO LANGUAGE LOCK)
// ==========================
function detectProduct(tokens) {
  const genericMap = [
    { keys: ["fan"], label: { es: "ventilador", en: "fan" } },
    { keys: ["shoe", "shoes"], label: { es: "zapatos", en: "shoes" } },
    { keys: ["bag"], label: { es: "bolsa", en: "bag" } },
    { keys: ["lamp", "led"], label: { es: "lámpara", en: "lamp" } },
    { keys: ["organizer"], label: { es: "organizador", en: "organizer" } }
  ];

  for (const m of genericMap) {
    if (m.keys.some(k => tokens.includes(k))) {
      return m.label;
    }
  }

  return null;
}

// ==========================
// ATTRIBUTES (NEUTRAL)
// ==========================
function detectAttributes(tokens) {
  const attributes = [];

  if (tokens.includes("portable")) attributes.push({ es: "portátil", en: "portable" });
  if (tokens.includes("mini")) attributes.push({ es: "compacto", en: "compact" });
  if (tokens.includes("usb")) attributes.push({ es: "USB", en: "USB" });

  return attributes;
}

// ==========================
// BUILD TITLE BY LANGUAGE
// ==========================
function buildTitle({ product, attributes, language }) {
  if (!product) return null;

  const lang = language?.startsWith("es") ? "es" : "en";

  let title = product[lang];

  if (attributes.length) {
    title += " " + attributes.map(a => a[lang]).join(" ");
  }

  return title;
}

// ==========================
// FORMAT
// ==========================
function sentenceCase(text) {
  const t = normalize(text).toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ==========================
// MAIN
// ==========================
function generateTitle(rawTitle, context = {}) {
  if (!rawTitle) return null;

  const language = context.language || "en";

  let clean = cleanNoise(rawTitle);
  const tokens = tokenize(clean);

  const product = detectProduct(tokens);
  const attributes = detectAttributes(tokens);

  let title = buildTitle({ product, attributes, language });

  // fallback → CLEAN, NOT TRANSLATE
  if (!title) {
    title = clean;
  }

  title = sentenceCase(title);

  return normalize(title);
}

module.exports = {
  generateTitle
};
