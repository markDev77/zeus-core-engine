const { detectLanguage } = require("./languageDetector");
const { translateText } = require("./translationEngine");
const { optimizeRegionalTitle } = require("./regionalTitleOptimizer");
const { optimizeRegionalDescription } = require("./regionalDescriptionOptimizer");
const { generateRegionalTags } = require("./regionalTagGenerator");
const { applyMarketSignals } = require("./marketSignalEngine");

function cleanTitle(title = "") {
  return String(title || "")
    .replace(/^\d+\s*(piece|pcs|set|juego|pieza|piezas)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateBaseTags(title = "") {

  const words = title
    .toLowerCase()
    .split(" ")
    .filter(w => w.length > 3);

  return [...new Set(words)].slice(0, 5);

}

function mapTaxonomy(category = "general") {

  const taxonomy = {

    pet_supplies: {
      shopify: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Collars",
      internal: "pet_supplies"
    },

    electronics: {
      shopify: "Electronics > Audio > Headphones",
      internal: "electronics"
    }

  };

  return taxonomy[category] || {
    shopify: "Miscellaneous",
    internal: category
  };

}

function transformProduct(input = {}) {

  const originalTitle = input.title || "";
  const originalDescription = input.description || "";

  const storeProfile = input.storeProfile || {
    country: "US",
    language: "en-US",
    currency: "USD",
    marketplace: "shopify",
    marketSignalMode: "enabled"
  };

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

  let categoryHint = "general";

  const categorySource =
    `${translatedTitle} ${translatedDescription}`.toLowerCase();

  if (
    categorySource.includes("dog") ||
    categorySource.includes("perro") ||
    categorySource.includes("pet")
  ) {
    categoryHint = "pet_supplies";
  }

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

  const taxonomy = mapTaxonomy(categoryHint);

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

    taxonomy: taxonomy.shopify

  };

  product = applyMarketSignals(product, storeProfile);

  return product;

}

module.exports = {
  transformProduct
};
