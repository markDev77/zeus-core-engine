const zeusTaxonomy = require("../data/zeusTaxonomy");

/*
Normalize text
*/
function normalize(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/*
Score category based on weighted keyword match
*/
function scoreCategory(text, keywords, weight = 1) {

  let score = 0;
  const matchedTerms = [];

  for (const word of keywords) {
    const normalizedWord = normalize(word);
    if (normalizedWord && text.includes(normalizedWord)) {
      score += weight;
      matchedTerms.push(normalizedWord);
    }
  }

  return {
    score,
    matchedTerms
  };

}

function getWeightedSegments(product = {}) {
  const title = normalize(product.title);
  const description = normalize(product.description);
  const tags = normalize((product.tags || []).join(" "));

  return {
    title,
    description,
    tags
  };
}

function applyHeuristicBoosts(category, combinedText) {
  let extraScore = 0;

  const fashionTerms = [
    "brooch",
    "badge",
    "pin",
    "jewelry",
    "jewellery",
    "cardigan",
    "jacket",
    "coat",
    "trousers",
    "pants",
    "dress",
    "blouse",
    "shirt",
    "hoodie",
    "sweater"
  ];

  const petsTerms = [
    "dog",
    "cat",
    "pet",
    "feeder",
    "collar",
    "leash",
    "pet supplies"
  ];

  const homeTerms = [
    "humidifier",
    "lamp",
    "kitchen",
    "home",
    "household",
    "decor",
    "chair"
  ];

  if (category === "fashion" && fashionTerms.some((term) => combinedText.includes(term))) {
    extraScore += 2.5;
  }

  if (category === "pet_supplies" && petsTerms.some((term) => combinedText.includes(term))) {
    extraScore += 2.5;
  }

  if ((category === "home" || category === "hogar" || category === "general_home") && homeTerms.some((term) => combinedText.includes(term))) {
    extraScore += 2.0;
  }

  return extraScore;
}

/*
Main Category Brain
*/
function suggestCategory(product) {

  const segments = getWeightedSegments(product);

  const combinedText = `${segments.title} ${segments.description} ${segments.tags}`;

  let bestCategory = "general";
  let bestScore = 0;
  let matchedTerms = [];

  for (const [category, data] of Object.entries(zeusTaxonomy)) {

    const titleResult = scoreCategory(segments.title, data.keywords, 2);
    const tagsResult = scoreCategory(segments.tags, data.keywords, 1.5);
    const descriptionResult = scoreCategory(segments.description, data.keywords, 1);

    const heuristicBoost = applyHeuristicBoosts(category, combinedText);

    const totalScore =
      titleResult.score +
      tagsResult.score +
      descriptionResult.score +
      heuristicBoost;

    const allMatchedTerms = Array.from(
      new Set([
        ...titleResult.matchedTerms,
        ...tagsResult.matchedTerms,
        ...descriptionResult.matchedTerms
      ])
    );

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCategory = category;
      matchedTerms = allMatchedTerms;
    }

  }

  /*
  Confidence calculation
  */

  let confidence = 0;

  if (bestScore > 0) {
    confidence = Math.min(0.55 + bestScore * 0.06, 0.95);
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
