// ZEUS CATEGORY RESOLVER v1 (LTM)
// NO inventa categorías
// Usa taxonomía del cliente + AI hints

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^\w\s>áéíóúñü]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitPath(path) {
  return normalize(path).split(">").map(p => p.trim());
}

// 🔥 score por coincidencia semántica simple
function scoreMatch(hintParts, categoryParts) {
  let score = 0;

  for (const h of hintParts) {
    for (const c of categoryParts) {
      if (c.includes(h) || h.includes(c)) {
        score += 1;
      }
    }
  }

  return score;
}

// 🔥 flatten Woo categories (árbol → lista)
function flattenCategories(categories, parentPath = "") {
  let result = [];

  for (const cat of categories) {
    const path = parentPath
      ? `${parentPath} > ${cat.name}`
      : cat.name;

    result.push({
      id: cat.id,
      name: cat.name,
      path
    });

    if (cat.children && cat.children.length) {
      result = result.concat(
        flattenCategories(cat.children, path)
      );
    }
  }

  return result;
}

// ==========================
// 🔥 MAIN RESOLVER
// ==========================
function resolveCategory({
  aiResult,
  categories = [],
  mode = "adaptive",
  threshold = 1
}) {
  try {
    if (!aiResult || !categories.length) {
      return {
        best_match: null,
        alternatives: [],
        confidence: 0
      };
    }

    const hints = aiResult.category_hints || [];

    const flatCategories = flattenCategories(categories);

    const scored = [];

    for (const cat of flatCategories) {
      const catParts = splitPath(cat.path);

      let bestScore = 0;

      for (const hint of hints) {
        const hintParts = splitPath(hint);
        const score = scoreMatch(hintParts, catParts);

        if (score > bestScore) {
          bestScore = score;
        }
      }

      if (bestScore > 0) {
        scored.push({
          ...cat,
          score: bestScore
        });
      }
    }

    // ordenar por score
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0] || null;

    // 🔥 confidence simple
    const confidence = best ? best.score : 0;

    // 🔴 modo strict
    if (mode === "strict") {
      return {
        best_match:
          confidence >= threshold ? best : null,
        alternatives: [],
        confidence
      };
    }

    // 🔵 modo adaptive
    const alternatives = scored.slice(1, 3);

    return {
      best_match:
        confidence >= threshold ? best : null,
      alternatives,
      confidence
    };

  } catch (err) {
    console.error("ZEUS CATEGORY RESOLVER ERROR:", err);
    return {
      best_match: null,
      alternatives: [],
      confidence: 0
    };
  }
}

module.exports = {
  resolveCategory
};
