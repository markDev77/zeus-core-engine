const { detectLanguage } = require("./languageDetector");
const { translateText } = require("./translationEngine");

/*
========================================
ZEUS PRODUCT TRANSFORMER
========================================
Transforma producto antes del Category Brain.
Ahora soporta:
- detección de idioma
- traducción regional
========================================
*/

function cleanTitle(title = "") {
  return title
    .replace(/^\d+\s*(piece|pcs|set)/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateTags(title = "") {
  const words = title
    .toLowerCase()
    .split(" ")
    .filter(w => w.length > 3);

  return [...new Set(words)].slice(0, 5);
}

function transformProduct(input = {}) {
  const originalTitle = input.title || "";
  const description = input.description || "";

  const storeProfile = input.storeProfile || {
    language: "en-US"
  };

  const targetLanguage = storeProfile.language || "en-US";

  const cleanedTitle = cleanTitle(originalTitle);

  /*
  LANGUAGE DETECTION
  */
  const detectedLanguage = detectLanguage(cleanedTitle + " " + description);

  /*
  TRANSLATION
  */
  const translatedTitle = translateText(
    cleanedTitle,
    detectedLanguage,
    targetLanguage
  );

  const translatedDescription = translateText(
    description,
    detectedLanguage,
    targetLanguage
  );

  const tags = generateTags(translatedTitle);

  return {
    engine: "ZEUS",
    originalTitle: originalTitle,
    optimizedTitle: translatedTitle,
    suggestedTags: tags,
    suggestedCategory: "general",
    categoryConfidence: 0,
    title: translatedTitle,
    description: translatedDescription,
    tags: tags,
    category: "general"
  };
}

module.exports = {
  transformProduct
};
