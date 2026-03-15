/*
========================================
ZEUS PRODUCT TRANSFORMER
========================================
Conecta los servicios reales del motor ZEUS
sin adapters inventados.
========================================
*/

const { detectLanguage } = require("./languageDetector");
const { translateText } = require("./translationEngine");
const { optimizeRegionalTitle } = require("./regionalTitleOptimizer");
const { optimizeRegionalDescription } = require("./regionalDescriptionOptimizer");
const { generateRegionalTags } = require("./regionalTagGenerator");
const { detectMarketSignal } = require("./marketSignalEngine");
const { applyProductIntelligence } = require("./productIntelligenceEngine");
const { mapTaxonomy } = require("./taxonomyMapper");

function normalize(text = "") {
  return String(text || "").trim();
}

function cleanTitle(title = "") {
  return String(title || "")
    .replace(/^\d+\s*(piece|pieces|pcs|set|sets|juego|pieza|piezas)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateBaseTags(title = "") {
  return [...new Set(
    String(title || "")
      .toLowerCase()
      .split(" ")
      .map(w => w.trim())
      .filter(w => w.length > 3)
  )].slice(0, 5);
}

function detectCategoryHint(title = "", description = "") {
  const source = `${title} ${description}`.toLowerCase();

  if (
    source.includes("dog") ||
    source.includes("perro") ||
    source.includes("pet") ||
    source.includes("collar")
  ) {
    return "pet_supplies";
  }

  if (
    source.includes("headphones") ||
    source.includes("earbuds") ||
    source.includes("audífonos") ||
    source.includes("audio")
  ) {
    return "electronics";
  }

  return "general";
}

function resolveStoreProfile(input = {}) {
  const inputProfile = input.storeProfile || {};

  const country = String(
    inputProfile.country ||
    input.country ||
    "US"
  ).toUpperCase();

  const language =
    inputProfile.language ||
    (country === "MX" ? "es-MX" : "en-US");

  return {
    country,
    language,
    currency: inputProfile.currency || (country === "MX" ? "MXN" : "USD"),
    marketplace: inputProfile.marketplace || input.marketplace || "shopify",
    marketSignalMode: inputProfile.marketSignalMode || "enabled"
  };
}

function transformProduct(input = {}) {
  const originalTitle = normalize(input.title);
  const originalDescription = normalize(input.description);

  const storeProfile = resolveStoreProfile(input);

  const cleanedTitle = cleanTitle(originalTitle);

  const detectedLanguage = detectLanguage(
    `${cleanedTitle} ${originalDescription}`
  );

  const translatedTitle = translateText(
    cleanedTitle,
    detectedLanguage,
    storeProfile.language
  );

  const translatedDescription = translateText(
    originalDescription,
    detectedLanguage,
    storeProfile.language
  );

  const categoryHint = detectCategoryHint(
    translatedTitle,
    translatedDescription
  );

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

  const baseTags = generateBaseTags(translatedTitle);

  const optimizedTags = generateRegionalTags({
    optimizedTitle,
    optimizedDescription,
    storeProfile,
    category: categoryHint,
    existingTags: baseTags
  });

  const taxonomy = mapTaxonomy(categoryHint, storeProfile);

  const marketSignal = detectMarketSignal({
    title: optimizedTitle,
    description: optimizedDescription
  });

  let product = {
    engine: "ZEUS",

    originalTitle,

    optimizedTitle,

    suggestedTags: optimizedTags,
    suggestedCategory: categoryHint,
    categoryConfidence: 0,

    title: optimizedTitle,
    description: optimizedDescription,
    tags: optimizedTags,

    category: taxonomy.internal,
    taxonomy: taxonomy.shopify,

    trendScore: marketSignal.score || 0,

    baseCategory: categoryHint,
    regionalCategory: {
      baseCategory: categoryHint,
      regionalCategory: taxonomy.internal,
      marketplace: storeProfile.marketplace,
      country: storeProfile.country
    }
  };

  product = applyProductIntelligence(product);

  return product;
}

module.exports = {
  transformProduct
};
