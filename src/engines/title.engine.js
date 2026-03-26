// /src/engines/title.engine.js

function normalize(text) {
  return String(text || "")
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
// DETECT PRODUCT CORE
// ==========================
function detectProduct(tokens) {
  const map = [
    { keys: ["fan"], label: "ventilador" },
    { keys: ["shoe", "shoes", "loafer"], label: "mocasines" },
    { keys: ["bag"], label: "bolsa" },
    { keys: ["organizer"], label: "organizador" },
    { keys: ["lamp", "led"], label: "lámpara" },
    { keys: ["massage"], label: "masajeador" }
  ];

  for (const m of map) {
    if (m.keys.some(k => tokens.includes(k))) {
      return m.label;
    }
  }

  return null;
}

// ==========================
// DETECT ATTRIBUTES
// ==========================
function detectAttributes(tokens) {
  const attributes = [];

  if (tokens.includes("portable")) attributes.push("portátil");
  if (tokens.includes("mini")) attributes.push("compacto");
  if (tokens.includes("electric")) attributes.push("eléctrico");
  if (tokens.includes("usb")) attributes.push("USB");

  return attributes;
}

// ==========================
// DETECT INTENT / USE
// ==========================
function detectUse(tokens) {
  if (tokens.includes("kitchen")) return "para cocina";
  if (tokens.includes("office")) return "para oficina";
  if (tokens.includes("home")) return "para hogar";
  if (tokens.includes("hair")) return "para cabello";

  return "";
}

// ==========================
// BUILD TITLE
// ==========================
function buildTitle({ product, attributes, use }) {
  if (!product) return null;

  let title = product;

  if (attributes.length) {
    title += " " + attributes.join(" ");
  }

  if (use) {
    title += " " + use;
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
// TRIM SMART
// ==========================
function trimSmart(text, max = 60) {
  if (text.length <= max) return text;

  const words = text.split(" ");
  let out = "";

  for (const w of words) {
    const test = out ? `${out} ${w}` : w;
    if (test.length > max) break;
    out = test;
  }

  return out || text.slice(0, max);
}

// ==========================
// MAIN
// ==========================
function generateTitle(rawTitle) {
  if (!rawTitle) return null;

  let clean = cleanNoise(rawTitle);
  const tokens = tokenize(clean);

  const product = detectProduct(tokens);
  const attributes = detectAttributes(tokens);
  const use = detectUse(tokens);

  let title = buildTitle({ product, attributes, use });

  // fallback
  if (!title) {
    title = clean;
  }

  title = sentenceCase(title);
  title = trimSmart(title, 60);

  return normalize(title);
}

// ==========================
// CONTEXT IMPROVER (SOFT)
// ==========================
function improveTitleWithContext(title) {
  if (!title) return title;

  let t = title.toLowerCase();

  if (t.includes("organizador") && t.includes("a4")) {
    return "Organizador A4 transparente para documentos";
  }

  if (t.includes("salpicadura")) {
    return "Protector contra salpicaduras para cocina";
  }

  return title;
}

module.exports = {
  generateTitle,
  improveTitleWithContext
};
