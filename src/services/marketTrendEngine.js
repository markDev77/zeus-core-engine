/*
========================================
ZEUS MARKET TREND ENGINE
========================================
Inyecta keywords de tendencia según
país y categoría.
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

function injectTrendKeywords(product = {}, storeProfile = {}) {

  const category = product.category || "general";

  const trendKeywords = getTrendKeywords(storeProfile, category);

  if (!trendKeywords.length) return product;

  let title = product.title || "";

  const tags = product.tags || [];

  // agregar al título solo si no existe

  trendKeywords.forEach(keyword => {

    if (!title.toLowerCase().includes(keyword)) {

      title += ` ${keyword}`;

    }

  });

  const newTags = [...new Set([...tags, ...trendKeywords])];

  return {
    ...product,
    title,
    tags: newTags
  };

}

module.exports = {
  injectTrendKeywords
};
