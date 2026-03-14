/*
========================================
ZEUS REGIONAL CATEGORY MAPPER
========================================
Convierte la categoría base interna
a categoría visible por región/país.
========================================
*/

const { getRegionalCategoryName } = require("../data/categoryMappings");

function mapRegionalCategory({
  baseCategory = "general",
  storeProfile = {}
}) {
  const country = String(storeProfile.country || "DEFAULT").toUpperCase();
  const marketplace = String(storeProfile.marketplace || "shopify").toLowerCase();

  const regionalCategory = getRegionalCategoryName(baseCategory, country);

  return {
    baseCategory,
    regionalCategory,
    marketplace,
    country
  };
}

module.exports = {
  mapRegionalCategory
};
