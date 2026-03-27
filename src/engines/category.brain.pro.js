// src/engines/category.brain.pro.js

const CATEGORY_RULES = [
  {
    match: ["necklace", "collar", "pendant", "cadena"],
    result: {
      domain: "Fashion",
      category: "Jewelry",
      subcategory: "Necklaces",
      type: "Pendant Necklace"
    }
  },
  {
    match: ["roller", "foam roller", "massage", "rodillo", "yoga"],
    result: {
      domain: "Sports",
      category: "Fitness",
      subcategory: "Recovery",
      type: "Foam Roller"
    }
  },
  {
    match: ["lamp", "light", "led", "luz", "lampara"],
    result: {
      domain: "Home",
      category: "Lighting",
      subcategory: "Decorative Lighting",
      type: "LED Light"
    }
  },
  {
    match: ["cleaning", "mop", "brush", "limpieza"],
    result: {
      domain: "Home",
      category: "Cleaning",
      subcategory: "Tools",
      type: "Cleaning Tool"
    }
  }
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(text, keywords) {
  let score = 0;
  for (const k of keywords) {
    if (text.includes(k)) score += 1;
  }
  return score;
}

function resolveCategoryPro({ title, description }) {
  const text = normalize(`${title} ${description}`);

  let best = null;
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    const score = scoreMatch(text, rule.match);

    if (score > bestScore) {
      best = rule.result;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) {
    return {
      ...best,
      confidence: Math.min(0.6 + bestScore * 0.1, 0.95),
      source: "rule_based_pro"
    };
  }

  return null;
}

module.exports = {
  resolveCategoryPro
};
