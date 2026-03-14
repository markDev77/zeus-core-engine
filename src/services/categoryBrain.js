const zeusTaxonomy = require("../data/zeusTaxonomy");

function normalize(text) {
  return text.toLowerCase();
}

function scoreCategory(title, keywords) {

  let score = 0;

  for (const word of keywords) {

    if (title.includes(word)) {
      score += 1;
    }

  }

  return score;

}

function suggestCategory(title, clientCategories = []) {

  const normalized = normalize(title);

  let bestCategory = "general";
  let bestScore = 0;

  for (const [category, data] of Object.entries(zeusTaxonomy)) {

    const score = scoreCategory(normalized, data.keywords);

    if (score > bestScore) {

      bestScore = score;
      bestCategory = category;

    }

  }

  let confidence = 0;

  if (bestScore > 0) {
    confidence = Math.min(0.5 + bestScore * 0.1, 0.95);
  }

  let mappedToClient = false;

  if (clientCategories.length > 0) {

    for (const clientCat of clientCategories) {

      if (
        clientCat.toLowerCase().includes(bestCategory)
      ) {

        bestCategory = clientCat;
        mappedToClient = true;

        break;

      }

    }

  }

  return {
    category: bestCategory,
    confidence: confidence,
    source: mappedToClient ? "client_tree" : "zeus_taxonomy",
    mappedToClient
  };

}

module.exports = {
  suggestCategory
};
