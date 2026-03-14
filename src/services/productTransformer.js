const { detectLanguage } = require("./languageDetector");
const { translateText } = require("./translationEngine");
const { optimizeRegionalTitle } = require("./regionalTitleOptimizer");
const { optimizeRegionalDescription } = require("./regionalDescriptionOptimizer");
const { generateRegionalTags } = require("./regionalTagGenerator");

/*
========================================
ZEUS PRODUCT TRANSFORMER
========================================
Transforma producto antes del Category Brain.
Ahora soporta:
- detección de idioma
- traducción regional
- regional title optimizer
- regional description optimizer
- regional tag generator
========================================
*/

function cleanTitle(title = "") {
  return String(title || "")
    .replace(/^\d+\s*(piece|pcs|set|juego|pieza|piezas)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateBaseTags(title = "") {
  const words = String(title || "")
    .toLowerCase()
    .split(" ")
    .map(word => word.trim())
    .filter(word => word.length > 3);

  return [...new Set(words)].slice(0, 5);
}

function transformProduct(input = {}) {
  const originalTitle = input.title || "";
  const originalDescription = input.description || "";

  const storeProfile = input.storeProfile || {
    country: "US",
    language: "en-US",
    currency: "USD",
    marketplace: "shopify"
  };

  const targetLanguage = storeProfile.language || "en-US";

  const cleanedTitle = cleanTitle(originalTitle);

  /*
  LANGUAGE DETECTION
  */
  const detectedLanguage = detectLanguage(`${cleanedTitle} ${originalDescription}`);

  /*
  TRANSLATION
  */
  const translatedTitle = translateText(
    cleanedTitle,
    detectedLanguage,
    targetLanguage
  );

  const translatedDescription = translateText(
    originalDescription,
    detectedLanguage,
    targetLanguage
  );

  /*
  BASE CATEGORY HINT
  */
  let categoryHint = "general";
  const categorySource = `${translatedTitle} ${translatedDescription}`.toLowerCase();

  if (
    categorySource.includes("perro") ||
    categorySource.includes("gato") ||
    categorySource.includes("dog") ||
    categorySource.includes("cat") ||
    categorySource.includes("mascota") ||
    categorySource.includes("pet")
  ) {
    categoryHint = "pet_supplies";
  }

  /*
  REGIONAL OPTIMIZATION
  */
  const optimizedTitle = optimizeRegionalTitle({
    translatedTitle,
    translatedDescription,
    storeProfile,
    category: categoryHint
  });

  const optimizedDescription = optimizeRegionalDescription({
    optimizedTitle,
    translatedDescription,
    storeProfile,
    category: categoryHint
  });

  const baseTags = generateBaseTags(optimizedTitle);

  const optimizedTags = generateRegionalTags({
    optimizedTitle,
    optimizedDescription,
    storeProfile,
    category: categoryHint,
    existingTags: baseTags
  });

  return {
    engine: "ZEUS",
    originalTitle,
    detectedLanguage,
    targetLanguage,
    translatedTitle,
    translatedDescription,
    optimizedTitle,
    suggestedTags: optimizedTags,
    suggestedCategory: categoryHint,
    categoryConfidence: 0,
    title: optimizedTitle,
    description: optimizedDescription,
    tags: optimizedTags,
    category: categoryHint
  };
}

module.exports = {
  transformProduct
};
