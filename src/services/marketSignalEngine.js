const { signals } = require("../data/marketSignals");

/*
========================================
ZEUS MARKET SIGNAL ENGINE
========================================
Detecta eventos activos por país y fecha
y aplica:
1) señales de mercado (eventos)
2) tendencias SEO por categoría
========================================
*/

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
        "entrenamiento canino",
        "mascotas",
        "accesorios para perros"
      ],

      electronics: [
        "gadgets",
        "tecnología portátil"
      ]

    },

    US: {

      pet_supplies: [
        "dog training",
        "pet accessories"
      ],

      electronics: [
        "wireless",
        "portable tech"
      ]

    }

  };

  const countryTrends = trends[country] || {};

  return countryTrends[category] || [];

}


/*
========================================
TREND INJECTION
========================================
*/

function injectTrendKeywords(product = {}, storeProfile = {}) {

  const category = product.category || "general";

  const trendKeywords = getTrendKeywords(storeProfile, category);

  if (!trendKeywords.length) return product;

  let title = product.title || "";

  let tags = product.tags || [];

  trendKeywords.forEach(keyword => {

    if (!title.toLowerCase().includes(keyword.toLowerCase())) {

      title += ` ${keyword}`;

    }

  });

  tags = [...new Set([...tags, ...trendKeywords])];

  return {

    ...product,

    title,

    optimizedTitle: title,

    tags

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

  const activeSignals = detectActiveSignals(country);

  /*
  =========================
  EVENT SIGNALS
  =========================
  */

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
