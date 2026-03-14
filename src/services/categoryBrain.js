/**
 * ZEUS Category Brain
 * Core classification engine
 * Governs product taxonomy decisions
 */

const CATEGORY_RULES = [
  {
    category: "pet_supplies",
    keywords: [
      "dog",
      "cat",
      "pet",
      "collar",
      "leash",
      "pet collar",
      "dog toy",
      "pet toy",
      "pet training"
    ]
  },
  {
    category: "electronics",
    keywords: [
      "earbuds",
      "headphones",
      "bluetooth",
      "charger",
      "usb",
      "power bank",
      "speaker"
    ]
  },
  {
    category: "home_kitchen",
    keywords: [
      "kitchen",
      "knife",
      "pan",
      "cook",
      "storage",
      "organizer"
    ]
  },
  {
    category: "beauty",
    keywords: [
      "skin",
      "beauty",
      "cosmetic",
      "face",
      "serum",
      "cream",
      "makeup"
    ]
  }
];

const CONFIDENCE_HIGH = 0.85;
const CONFIDENCE_MEDIUM = 0.60;

/**
 * Normalize text
 */
function normalizeText(text) {
  if (!text) return "";
  return text.toLowerCase();
}

/**
 * Score category match
 */
function scoreCategory(text, rule) {
  let matches = [];

  for (const keyword of rule.keywords) {
    if (text.includes(keyword)) {
      matches.push(keyword);
    }
  }

  const score = matches.length / rule.keywords.length;

  return {
    score,
    matches
  };
}

/**
 * Suggest category
 */
function suggestCategory(product) {
  const title = normalizeText(product.title || "");
  const description = normalizeText(product.description || "");
  const tags = normalizeText((product.tags || []).join(" "));

  const fullText = `${title} ${description} ${tags}`;

  let bestCategory = null;
  let bestScore = 0;
  let bestMatches = [];

  for (const rule of CATEGORY_RULES) {
    const result = scoreCategory(fullText, rule);

    if (result.score > bestScore) {
      bestScore = result.score;
      bestCategory = rule.category;
      bestMatches = result.matches;
    }
  }

  let decision = "MANUAL_REVIEW";

  if (bestScore >= CONFIDENCE_HIGH) {
    decision = "AUTO_ASSIGN";
  } else if (bestScore >= CONFIDENCE_MEDIUM) {
    decision = "SUGGEST_REVIEW";
  }

  return {
    category: bestCategory || "general",
    confidence: Number(bestScore.toFixed(2)),
    matchedTerms: bestMatches,
    decision
  };
}

module.exports = {
  suggestCategory
};
