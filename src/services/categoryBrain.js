const zeusTaxonomy = require("../data/zeusTaxonomy");

/*
Normalize text
*/
function normalize(text) {

  if (!text) return "";

  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}

/*
Synonym expansion
*/

const categorySynonyms = {

  health: [
    "alcohol wipe",
    "alcohol cotton",
    "antiseptic",
    "disinfectant",
    "sanitizing wipe",
    "medical wipe",
    "alcohol pad"
  ],

  pet_supplies: [
    "dog toy",
    "cat toy",
    "pet feeder",
    "pet bowl",
    "pet collar",
    "pet leash"
  ],

  fashion: [
    "shirt",
    "hoodie",
    "jacket",
    "coat",
    "dress",
    "pants",
    "jeans",
    "sweater"
  ],

  home: [
    "kitchen organizer",
    "storage box",
    "home decor",
    "lamp",
    "humidifier",
    "household item"
  ]

};

/*
Strong signal detection
*/

function detectStrongSignal(text) {

  for (const [category, words] of Object.entries(categorySynonyms)) {

    for (const word of words) {

      if (text.includes(normalize(word))) {

        return category;

      }

    }

  }

  return null;

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

/*
Blacklist rules
*/

function applyBlacklist(category, combinedText) {

  const blacklist = {

    electronics: [
      "shirt",
      "dress",
      "dog",
      "cat",
      "wipe",
      "disinfect"
    ],

    tools: [
      "shirt",
      "dress",
      "dog toy"
    ]

  };

  if (!blacklist[category]) return category;

  const blocked = blacklist[category];

  for (const word of blocked) {

    if (combinedText.includes(word)) {

      return "general";

    }

  }

  return category;

}

/*
Main Category Brain
*/

function suggestCategory(product) {

  const segments = getWeightedSegments(product);

  const combinedText =
    segments.title +
    " " +
    segments.description +
    " " +
    segments.tags;

  /*
  Strong signal override
  */

  const strongSignal = detectStrongSignal(combinedText);

  if (strongSignal) {

    return {
      category: strongSignal,
      confidence: 0.92,
      decision: "strong_signal",
      matchedTerms: []
    };

  }

  let bestCategory = "general";
  let bestScore = 0;
  let matchedTerms = [];

  for (const [category, data] of Object.entries(zeusTaxonomy)) {

    const titleResult = scoreCategory(segments.title, data.keywords, 3);
    const tagsResult = scoreCategory(segments.tags, data.keywords, 2);
    const descriptionResult = scoreCategory(segments.description, data.keywords, 1);

    const totalScore =
      titleResult.score +
      tagsResult.score +
      descriptionResult.score;

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
  Blacklist correction
  */

  bestCategory = applyBlacklist(bestCategory, combinedText);

  /*
  Confidence calculation
  */

  let confidence = 0;

  if (bestScore > 0) {

    confidence = Math.min(0.55 + bestScore * 0.05, 0.95);

  }

  let decision = "fallback";

  if (confidence >= 0.8) decision = "strong_match";
  if (confidence >= 0.6 && confidence < 0.8) decision = "probable_match";

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
