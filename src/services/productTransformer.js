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

function stripHtml(html = "") {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<div[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(title = "") {
  return String(title || "")
    .replace(/^\d+\s*(piece|pieces|pcs|set|sets|juego|pieza|piezas)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateBaseTags(title = "") {
  return [
    ...new Set(
      String(title || "")
        .toLowerCase()
        .split(" ")
        .map((w) => w.trim())
        .filter((w) => w.length > 3)
    )
  ].slice(0, 8);
}

function detectCategoryHint(title = "", description = "") {
  const source = `${title} ${description}`.toLowerCase();

  if (
    source.includes("document bag") ||
    source.includes("file bag") ||
    source.includes("zipper file bag") ||
    source.includes("stationery bag") ||
    source.includes("paper storage") ||
    source.includes("document pouch") ||
    source.includes("mesh zipper pouch") ||
    source.includes("file pouch") ||
    source.includes("receipt bag") ||
    source.includes("bill bag")
  ) {
    return "document_bags";
  }

  if (
    source.includes("file folder") ||
    source.includes("document folder") ||
    source.includes("accordion folder") ||
    source.includes("expanding folder") ||
    source.includes("a4 folder")
  ) {
    return "file_folders";
  }

  if (
    source.includes("office") ||
    source.includes("stationery") ||
    source.includes("document") ||
    source.includes("folder") ||
    source.includes("file organizer")
  ) {
    return "office_supplies";
  }

  if (
    source.includes("beanie") ||
    source.includes("winter hat") ||
    source.includes("knit hat") ||
    source.includes("hat") ||
    source.includes("cap") ||
    source.includes("gorro") ||
    source.includes("cachucha") ||
    source.includes("boot") ||
    source.includes("boots") ||
    source.includes("bota") ||
    source.includes("shoe") ||
    source.includes("shoes") ||
    source.includes("calzado")
  ) {
    return "fashion";
  }

  if (
    source.includes("dog") ||
    source.includes("perro") ||
    source.includes("pet collar") ||
    source.includes("pet leash") ||
    source.includes("dog harness") ||
    source.includes("cat toy") ||
    source.includes("dog toy") ||
    source.includes("pet feeder") ||
    source.includes("pet bowl") ||
    source.includes("pet bed")
  ) {
    return "pet_supplies";
  }

  if (
    source.includes("headphones") ||
    source.includes("earbuds") ||
    source.includes("audifonos") ||
    source.includes("audífonos") ||
    source.includes("audio") ||
    source.includes("speaker") ||
    source.includes("microphone") ||
    source.includes("razor") ||
    source.includes("shaver") ||
    source.includes("beard trimmer") ||
    source.includes("hair clipper") ||
    source.includes("trimmer")
  ) {
    return "electronics";
  }

  if (
    source.includes("phone case") ||
    source.includes("screen protector") ||
    source.includes("wireless charger") ||
    source.includes("phone holder") ||
    source.includes("charging cable")
  ) {
    return "mobile_accessories";
  }

  if (
    source.includes("keyboard") ||
    source.includes("mouse") ||
    source.includes("usb hub") ||
    source.includes("webcam") ||
    source.includes("laptop stand")
  ) {
    return "computer_accessories";
  }

  if (
    source.includes("storage box") ||
    source.includes("drawer organizer") ||
    source.includes("closet organizer") ||
    source.includes("storage basket")
  ) {
    return "storage_organization";
  }

  if (
    source.includes("kitchen") ||
    source.includes("food container") ||
    source.includes("dish rack") ||
    source.includes("knife set") ||
    source.includes("pan set")
  ) {
    return "home_kitchen";
  }

  if (
    source.includes("makeup") ||
    source.includes("cosmetic") ||
    source.includes("skincare") ||
    source.includes("serum") ||
    source.includes("lipstick")
  ) {
    return "beauty";
  }

  if (
    source.includes("fitness") ||
    source.includes("yoga") ||
    source.includes("gym") ||
    source.includes("exercise") ||
    source.includes("resistance band")
  ) {
    return "sports";
  }

  if (
    source.includes("car charger") ||
    source.includes("dash cam") ||
    source.includes("seat cover") ||
    source.includes("vehicle") ||
    source.includes("automotive")
  ) {
    return "automotive";
  }

  if (
    source.includes("easter egg toy") ||
    source.includes("educational toy") ||
    source.includes("kids toy") ||
    source.includes("board game") ||
    source.includes("building blocks") ||
    source.includes("plush toy") ||
    source.includes("toy") ||
    source.includes("puzzle") ||
    source.includes("science and education") ||
    source.includes("science education")
  ) {
    return "toys";
  }

  if (
    source.includes("tool kit") ||
    source.includes("screwdriver") ||
    source.includes("drill") ||
    source.includes("socket set") ||
    source.includes("hardware")
  ) {
    return "tools";
  }

  if (
    source.includes("bag") ||
    source.includes("backpack") ||
    source.includes("travel bag") ||
    source.includes("crossbody bag") ||
    source.includes("handbag")
  ) {
    return "bags_luggage";
  }

  if (
    source.includes("shirt") ||
    source.includes("hoodie") ||
    source.includes("jacket") ||
    source.includes("dress") ||
    source.includes("pants") ||
    source.includes("jeans")
  ) {
    return "fashion";
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
  const cleanedDescription = stripHtml(originalDescription);

  const detectedLanguage = detectLanguage(
    `${cleanedTitle} ${cleanedDescription}`
  );

  const translatedTitle = translateText(
    cleanedTitle,
    detectedLanguage,
    storeProfile.language
  );

  const translatedDescription = translateText(
    cleanedDescription,
    detectedLanguage,
    storeProfile.language
  );

  /*
  ========================================
  CATEGORY HINT DEBE BASARSE EN CONTENIDO
  LIMPIO Y ORIGINAL, NO EN TEXTO SEO GENERADO
  ========================================
  */
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

  const baseTags = generateBaseTags(`${translatedTitle} ${translatedDescription}`);

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
