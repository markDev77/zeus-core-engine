/*
========================================
ZEUS REGIONAL CATEGORY MAPPINGS
========================================
Mapeo de categoría base interna ZEUS
hacia categoría regional visible por país.
========================================
*/

const CATEGORY_MAPPINGS = {
  DEFAULT: {
    general: "General",
    pet_supplies: "Pet Supplies",
    home_kitchen: "Home & Kitchen",
    electronics: "Electronics",
    beauty: "Beauty",
    fashion: "Fashion",
    sports_outdoors: "Sports & Outdoors",
    baby: "Baby"
  },

  US: {
    general: "General",
    pet_supplies: "Pet Supplies",
    home_kitchen: "Home & Kitchen",
    electronics: "Electronics",
    beauty: "Beauty",
    fashion: "Fashion",
    sports_outdoors: "Sports & Outdoors",
    baby: "Baby"
  },

  MX: {
    general: "General",
    pet_supplies: "Mascotas",
    home_kitchen: "Hogar y Cocina",
    electronics: "Electrónica",
    beauty: "Belleza",
    fashion: "Moda",
    sports_outdoors: "Deportes y Aire Libre",
    baby: "Bebés"
  },

  CO: {
    general: "General",
    pet_supplies: "Mascotas",
    home_kitchen: "Hogar y Cocina",
    electronics: "Electrónica",
    beauty: "Belleza",
    fashion: "Moda",
    sports_outdoors: "Deportes y Aire Libre",
    baby: "Bebé"
  },

  SV: {
    general: "General",
    pet_supplies: "Mascotas",
    home_kitchen: "Hogar y Cocina",
    electronics: "Electrónica",
    beauty: "Belleza",
    fashion: "Moda",
    sports_outdoors: "Deportes y Aire Libre",
    baby: "Bebés"
  }
};

function normalizeCountry(country = "DEFAULT") {
  return String(country || "DEFAULT").trim().toUpperCase();
}

function getRegionalCategoryName(baseCategory = "general", country = "DEFAULT") {
  const safeCountry = normalizeCountry(country);
  const countryMap = CATEGORY_MAPPINGS[safeCountry] || CATEGORY_MAPPINGS.DEFAULT;

  return (
    countryMap[baseCategory] ||
    CATEGORY_MAPPINGS.DEFAULT[baseCategory] ||
    baseCategory ||
    "General"
  );
}

module.exports = {
  CATEGORY_MAPPINGS,
  getRegionalCategoryName
};
