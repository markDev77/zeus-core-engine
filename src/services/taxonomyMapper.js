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
      shopify: "Animals & Pet Supplies > Pet Supplies",
      internal: "pet_supplies"
    },

    electronics: {
      shopify: "Electronics > Audio > Headphones",
      internal: "electronics"
    },

    home: {
      shopify: "Home & Garden > Kitchen & Dining",
      internal: "home"
    },

    toys: {
      shopify: "Toys & Games",
      internal: "toys"
    },

    fashion: {
      shopify: "Apparel & Accessories > Clothing Accessories",
      internal: "fashion"
    },

    sports: {
      shopify: "Sporting Goods",
      internal: "sports"
    },

    beauty: {
      shopify: "Health & Beauty > Personal Care",
      internal: "beauty"
    },

    automotive: {
      shopify: "Vehicles & Parts",
      internal: "automotive"
    },

    tools: {
      shopify: "Hardware > Tools",
      internal: "tools"
    },

    office_supplies: {
      shopify: "Office Supplies",
      internal: "office_supplies"
    },

    bags_luggage: {
      shopify: "Luggage & Bags",
      internal: "bags_luggage"
    },

    mobile_accessories: {
      shopify: "Electronics > Communications > Telephony > Mobile Phone Accessories",
      internal: "mobile_accessories"
    },

    computer_accessories: {
      shopify: "Electronics > Computers > Computer Accessories",
      internal: "computer_accessories"
    },

    storage_organization: {
      shopify: "Home & Garden > Storage & Organization",
      internal: "storage_organization"
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
