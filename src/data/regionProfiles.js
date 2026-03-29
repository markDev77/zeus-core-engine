const REGION_PROFILES = {
  DEFAULT: {
    country: "US",
    language: "en-US",
    currency: "USD",
    marketplace: "shopify",
    catalogOrigin: "external",
    translationMode: "auto",
    marketSignalMode: "enabled",
    seoLocale: "en-US",

    // 🔥 ESTÁNDAR
    titleStyle: "title",
    descriptionStyle: "storytelling",
    tagStyle: "generic",

    categoryLocale: "en"
  },

  MX: {
    country: "MX",
    language: "es-MX",
    currency: "MXN",
    marketplace: "shopify",
    catalogOrigin: "external",
    translationMode: "auto",
    marketSignalMode: "enabled",
    seoLocale: "es-MX",

    // 🔥 AJUSTE CLAVE
    titleStyle: "title",
    descriptionStyle: "bullets",
    tagStyle: "mx-commerce",

    categoryLocale: "es"
  },

  CO: {
    country: "CO",
    language: "es-CO",
    currency: "COP",
    marketplace: "shopify",
    catalogOrigin: "external",
    translationMode: "auto",
    marketSignalMode: "enabled",
    seoLocale: "es-CO",

    // 🔥 AJUSTE
    titleStyle: "title",
    descriptionStyle: "bullets",
    tagStyle: "co-commerce",

    categoryLocale: "es"
  },

  SV: {
    country: "SV",
    language: "es-SV",
    currency: "USD",
    marketplace: "shopify",
    catalogOrigin: "external",
    translationMode: "auto",
    marketSignalMode: "enabled",
    seoLocale: "es-SV",

    // 🔥 AJUSTE
    titleStyle: "title",
    descriptionStyle: "bullets",
    tagStyle: "sv-commerce",

    categoryLocale: "es"
  },

  US: {
    country: "US",
    language: "en-US",
    currency: "USD",
    marketplace: "shopify",
    catalogOrigin: "external",
    translationMode: "auto",
    marketSignalMode: "enabled",
    seoLocale: "en-US",

    // 🔥 DIFERENCIA CLAVE
    titleStyle: "title",
    descriptionStyle: "storytelling",
    tagStyle: "us-commerce",

    categoryLocale: "en"
  }
};

function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}

function normalizeCountry(country) {
  if (!country || typeof country !== "string") {
    return "DEFAULT";
  }

  const normalized = country.trim().toUpperCase();

  if (REGION_PROFILES[normalized]) {
    return normalized;
  }

  return "DEFAULT";
}

function getRegionProfile(country = "DEFAULT") {
  const countryCode = normalizeCountry(country);
  return cloneProfile(REGION_PROFILES[countryCode] || REGION_PROFILES.DEFAULT);
}

module.exports = {
  REGION_PROFILES,
  getRegionProfile,
  normalizeCountry
};
