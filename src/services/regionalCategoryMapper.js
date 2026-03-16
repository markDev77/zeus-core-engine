/*
========================================
ZEUS REGIONAL CATEGORY MAPPER
========================================
Convierte la categoría base interna
a categoría visible por región/país.
========================================
*/

const { getRegionalCategoryName } = require("../data/categoryMappings");

function buildShopifyTaxonomyQuery(baseCategory = "general") {
  const category = String(baseCategory || "general").toLowerCase();

  switch (category) {
    case "pet_supplies":
      return "Pet Supplies";
    case "home":
    case "hogar":
      return "Home";
    case "electronics":
    case "electronica":
      return "Electronics";
    case "fashion":
    case "moda":
      return "Apparel";
    case "beauty":
    case "belleza":
      return "Beauty";
    case "sports":
    case "deportes":
      return "Sporting Goods";
    default:
      return category.replace(/_/g, " ");
  }
}

function mapRegionalCategory({
  baseCategory = "general",
  storeProfile = {}
}) {

  /*
  ========================================
  COUNTRY DETECTION
  ========================================
  prioridad:
  1 storeProfile.country
  2 storeProfile.region
  3 DEFAULT
  ========================================
  */

  const country =
    String(
      storeProfile.country ||
      storeProfile.region ||
      "DEFAULT"
    ).toUpperCase();

  /*
  ========================================
  MARKETPLACE DETECTION
  ========================================
  */

  const marketplace =
    String(
      storeProfile.marketplace ||
      "shopify"
    ).toLowerCase();

  /*
  ========================================
  CATEGORY MAPPING
  ========================================
  */

  const regionalCategory =
    getRegionalCategoryName(
      baseCategory,
      country
    );

  const shopifyTaxonomyQuery =
    buildShopifyTaxonomyQuery(baseCategory);

  /*
  ========================================
  RETURN STRUCTURE
  ========================================
  */

  return {
    baseCategory,
    regionalCategory,
    marketplace,
    country,
    shopifyTaxonomyQuery
  };

}

module.exports = {
  mapRegionalCategory
};
