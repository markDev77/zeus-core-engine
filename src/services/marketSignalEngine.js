const { signals } = require("../data/marketSignals");

/*
========================================
ZEUS MARKET SIGNAL ENGINE
========================================
Detecta eventos activos por país y fecha
y aplica:
1) señales de mercado (eventos)
2) tendencias SEO por categoría
3) filtro de relevancia para evitar
   contaminación SEO
========================================
*/

const TREND_THRESHOLD = 0.4;

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function detectActiveSignals(country) {

  const month = getCurrentMonth();

  const active = signals.filter(signal => {

    if (!signal.countries.includes(country)) return false;

    if (!signal.months.includes(month)) return false;

    return true;

  });

  active.sort((a,b)=> b.priority - a.priority);

  return active;

}

/*
========================================
TREND KEYWORDS
========================================
*/

function getTrendKeywords(storeProfile = {}, category = "general") {

  const country = String(storeProfile.country || "US").toUpperCase();

  const trends = {

    MX: {

      pet_supplies: [
        "entrenamiento",
        "perro",
        "canino"
      ],

      electronics: [
        "gadgets",
        "tecnología"
      ]

    },

    US: {

      pet_supplies: [
        "dog",
        "training",
        "pet"
      ],

      electronics: [
        "wireless",
        "portable"
      ]

    }

  };

  const countryTrends = trends[country] || {};

  return countryTrends[category] || [];

}

/*
========================================
RELEVANCE SCORE
========================================
*/

function calculateRelevance(product = {}, keywords = []) {

  const text = `${product.title} ${product.description}`.toLowerCase();

  let matches = 0;

  keywords.forEach(keyword => {

    if (text.includes(keyword)) {
      matches++;
    }

  });

  if (!keywords.length) return 0;

  return matches / keywords.length;

}

/*
========================================
TREND INJECTION CON FILTRO
========================================
*/

function injectTrendKeywords(product = {}, storeProfile = {}) {

  const category = product.category || "general";

  const trendKeywords = getTrendKeywords(storeProfile, category);

  if (!trendKeywords.length) return product;

  const score = calculateRelevance(product, trendKeywords);

  if (score < TREND_THRESHOLD) {

    return product;

  }

  let title = product.title || "";

  let tags = product.tags || [];

  trendKeywords.forEach(keyword => {

    if (!title.toLowerCase().includes(keyword)) {

      title += ` ${keyword}`;

    }

  });

  tags = [...new Set([...tags, ...trendKeywords])];

  return {

    ...product,

    title,

    optimizedTitle: title,

    tags,

    trendScore: score

  };

}

/*
========================================
MAIN ENGINE
========================================
*/

function applyMarketSignals(product, storeProfile) {

  if (!storeProfile) return product;

  if (storeProfile.marketSignalMode !== "enabled") {
    return product;
  }

  const country = storeProfile.country || "US";

  /*
  =========================
  EVENT SIGNALS
  =========================
  */

  const activeSignals = detectActiveSignals(country);

  if (activeSignals.length) {

    const signal = activeSignals[0];

    const suffix =
      (signal.titleSuffix && signal.titleSuffix[country]) ||
      (signal.titleSuffix && signal.titleSuffix["US"]);

    if (suffix) {

      const updatedTitle = `${product.title} | ${suffix}`;

      product = {

        ...product,

        marketSignal: signal.id,

        title: updatedTitle,

        optimizedTitle: updatedTitle

      };

    }

  }

  /*
  =========================
  TREND INJECTION
  =========================
  */

  product = injectTrendKeywords(product, storeProfile);

  return product;

}

module.exports = {
  applyMarketSignals
};
