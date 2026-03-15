/*
========================================
ZEUS TAXONOMY MAPPER
========================================
Mapea categorías internas a taxonomía
tipo Shopify / marketplace.
========================================
*/

function mapTaxonomy(category = "general", storeProfile = {}) {

  const country = String(storeProfile.country || "US").toUpperCase();

  const taxonomy = {

    pet_supplies: {
      shopify: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Collars",
      internal: "pet_supplies"
    },

    electronics: {
      shopify: "Electronics > Audio > Headphones",
      internal: "electronics"
    },

    home: {
      shopify: "Home & Garden > Kitchen & Dining",
      internal: "home"
    }

  };

  return taxonomy[category] || {
    shopify: "Miscellaneous",
    internal: category
  };

}

module.exports = {
  mapTaxonomy
};
