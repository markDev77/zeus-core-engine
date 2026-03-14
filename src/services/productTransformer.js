/**
 * ZEUS Product Transformer
 * Responsible for optimization pipeline
 */

const { suggestCategory } = require("./categoryBrain");

/**
 * Normalize title
 */
function normalizeTitle(title) {
  if (!title) return "Untitled Product";

  return title
    .replace(/^\d+\s*(piece|pcs|pc|set)/i, "")
    .trim();
}

/**
 * Extract tags
 */
function generateTags(title) {
  if (!title) return [];

  const words = title
    .toLowerCase()
    .split(" ")
    .filter(w => w.length > 3);

  return [...new Set(words)].slice(0, 6);
}

/**
 * Main transformer
 */
function transformProduct(inputProduct) {
  const originalTitle = inputProduct.title || "";

  const optimizedTitle = normalizeTitle(originalTitle);

  const suggestedTags = generateTags(optimizedTitle);

  const categoryResult = suggestCategory({
    title: optimizedTitle,
    description: inputProduct.description || "",
    tags: suggestedTags
  });

  return {
    engine: "ZEUS",

    originalTitle,

    optimizedTitle,

    suggestedTags,

    suggestedCategory: categoryResult.category,

    categoryConfidence: categoryResult.confidence,

    categoryDecision: categoryResult.decision,

    matchedTerms: categoryResult.matchedTerms,

    title: optimizedTitle,

    description: inputProduct.description || "",

    tags: suggestedTags,

    category: categoryResult.category
  };
}

module.exports = {
  transformProduct
};
