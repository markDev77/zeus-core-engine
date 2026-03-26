// /src/core/language.adapter.js

function normalizeLanguage(lang) {
  if (!lang) return "en";

  return String(lang)
    .toLowerCase()
    .split("-")[0]
    .split("_")[0];
}

// ==========================
// BASIC WORD MAP (MINIMAL)
// ==========================
const wordMaps = {
  es: {
    portable: "portátil",
    mini: "mini",
    electric: "eléctrico",
    fan: "ventilador",
    shoes: "zapatos",
    bag: "bolsa"
  },
  en: {}, // base language (no translate)
  pt: {
    portable: "portátil",
    mini: "mini",
    electric: "elétrico",
    fan: "ventilador",
    shoes: "sapatos",
    bag: "bolsa"
  }
};

// ==========================
// TRANSLATE WORDS (SAFE)
// ==========================
function translateWords(text, language = "en") {
  const lang = normalizeLanguage(language);

  if (!wordMaps[lang]) return text;

  let result = String(text || "");

  const map = wordMaps[lang];

  Object.keys(map).forEach((key) => {
    result = result.replace(
      new RegExp(`\\b${key}\\b`, "gi"),
      map[key]
    );
  });

  return result;
}

// ==========================
// PROMPT LANGUAGE BUILDER
// ==========================
function getLanguageInstruction(language) {
  const lang = normalizeLanguage(language);

  const map = {
    es: "Responde en español.",
    en: "Respond in English.",
    pt: "Responda em português."
  };

  return map[lang] || map.en;
}

module.exports = {
  normalizeLanguage,
  translateWords,
  getLanguageInstruction
};
