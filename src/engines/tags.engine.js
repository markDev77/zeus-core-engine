// ZEUS TAGS ENGINE v1
// Genera tags semánticos (SEO + conversacional)
// Compatible con structured AI output

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^\w\sáéíóúñü]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalizeTag(tag) {
  return tag
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractFromTitle(title = "") {
  const clean = normalize(title);

  return clean
    .split(" ")
    .filter(w => w.length > 3)
    .slice(0, 5);
}

function extractIntentTags(intent = {}) {
  const out = [];

  if (intent.primary) out.push(intent.primary);
  if (intent.secondary) out.push(intent.secondary);
  if (intent.purchase_driver) out.push(intent.purchase_driver);

  return out;
}

function cleanTags(tags, min = 8, max = 12) {
  const seen = new Set();
  const final = [];

  for (const tag of tags) {
    const clean = normalize(tag);

    if (!clean || clean.length < 3) continue;

    if (seen.has(clean)) continue;

    seen.add(clean);
    final.push(capitalizeTag(clean));

    if (final.length >= max) break;
  }

  // 🔥 asegurar mínimo
  return final.slice(0, Math.max(min, final.length));
}

// ==========================
// 🔥 MAIN ENGINE
// ==========================
function buildTags({ aiResult }) {
  try {
    if (!aiResult) return [];

    const {
      keywords = [],
      title_base = "",
      intent = {}
    } = aiResult;

    // ==========================
    // 🔹 FUENTES
    // ==========================

    const keywordTags = keywords;
    const titleTags = extractFromTitle(title_base);
    const intentTags = extractIntentTags(intent);

    // ==========================
    // 🔹 COMBINACIÓN
    // ==========================

    const combined = [
      ...keywordTags,
      ...titleTags,
      ...intentTags
    ];

    // ==========================
    // 🔹 LIMPIEZA FINAL
    // ==========================

    const finalTags = cleanTags(combined, 8, 12);

    return finalTags;

  } catch (err) {
    console.error("ZEUS TAGS ENGINE ERROR:", err);
    return [];
  }
}

module.exports = {
  buildTags
};
