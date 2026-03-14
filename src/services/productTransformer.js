const { detectLanguage } = require("./languageDetector");
const { translateText } = require("./translationEngine");
const { optimizeRegionalTitle } = require("./regionalTitleOptimizer");
const { optimizeRegionalDescription } = require("./regionalDescriptionOptimizer");
const { generateRegionalTags } = require("./regionalTagGenerator");
const { mapRegionalCategory } = require("./regionalCategoryMapper");

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
- regional category mapper base
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

function inferBaseCategory(translatedTitle = "", translatedDescription = "") {
  const categorySource = `${translatedTitle} ${translatedDescription}`.toLowerCase();

  if (
    categorySource.includes("perro") ||
    categorySource.includes("gato") ||
    categorySource.includes("dog") ||
    categorySource.includes("cat") ||
    categorySource.includes("mascota") ||
    categorySource.includes("pet")
  ) {
    return "pet_supplies";
  }

  if (
    categorySource.includes("kitchen") ||
    categorySource.includes("cocina") ||
    categorySource.includes("home") ||
    categorySource.includes("hogar")
  ) {
    return "home_kitchen";
  }

  if (
    categorySource.includes("wireless") ||
    categorySource.includes("bluetooth") ||
    categorySource.includes("electronic") ||
    categorySource.includes("electrónico") ||
    categorySource.includes("electrónica")
  ) {
    return "electronics";
  }

  return "general";
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
  const baseCategory = inferBaseCategory(
    translatedTitle,
    translatedDescription
  );

  /*
  REGIONAL OPTIMIZATION
  */
  const optimizedTitle = optimizeRegionalTitle({
    translatedTitle,
    translatedDescription,
    storeProfile,
    category: baseCategory
  });

  const optimizedDescription = optimizeRegionalDescription({
    optimizedTitle,
    translatedDescription,
    storeProfile,
    category: baseCategory
  });

  const baseTags = generateBaseTags(optimizedTitle);

  const optimizedTags = generateRegionalTags({
    optimizedTitle,
    optimizedDescription,
    storeProfile,
    category: baseCategory,
    existingTags: baseTags
  });

  const categoryMapping = mapRegionalCategory({
    baseCategory,
    storeProfile
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
    suggestedCategory: baseCategory,
    regionalCategory: categoryMapping.regionalCategory,
    baseCategory: categoryMapping.baseCategory,
    categoryConfidence: 0,
    title: optimizedTitle,
    description: optimizedDescription,
    tags: optimizedTags,
    category: baseCategory
  };
}

module.exports = {
  transformProduct
};
