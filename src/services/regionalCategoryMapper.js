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

  /*
  ========================================
  RETURN STRUCTURE
  ========================================
  */

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
