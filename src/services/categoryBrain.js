const zeusTaxonomy = require("../data/zeusTaxonomy");

/*
Normalize text
*/
function normalize(text) {
  if (!text) return "";
  return text.toLowerCase();
}

/*
Score category based on keyword match
*/
function scoreCategory(text, keywords) {

  let score = 0;
  const matchedTerms = [];

  for (const word of keywords) {

    if (text.includes(word)) {
      score += 1;
      matchedTerms.push(word);
    }

  }

  return {
    score,
    matchedTerms
  };

}

/*
Main Category Brain
*/
function suggestCategory(product) {

  const title = normalize(product.title);
  const description = normalize(product.description);
  const tags = normalize((product.tags || []).join(" "));

  const combinedText = `${title} ${description} ${tags}`;

  let bestCategory = "general";
  let bestScore = 0;
  let matchedTerms = [];

  for (const [category, data] of Object.entries(zeusTaxonomy)) {

    const result = scoreCategory(combinedText, data.keywords);

    if (result.score > bestScore) {

      bestScore = result.score;
      bestCategory = category;
      matchedTerms = result.matchedTerms;

    }

  }

  /*
  Confidence calculation
  */

  let confidence = 0;

  if (bestScore > 0) {
    confidence = Math.min(0.55 + bestScore * 0.1, 0.95);
  }

  /*
  Decision logic
  */

  let decision = "fallback";

  if (confidence >= 0.8) {
    decision = "strong_match";
  }

  if (confidence >= 0.6 && confidence < 0.8) {
    decision = "probable_match";
  }

  return {
    category: bestCategory,
    confidence,
    decision,
    matchedTerms
  };

}

module.exports = {
  suggestCategory
};
