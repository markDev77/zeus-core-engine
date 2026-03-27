const { SHOPIFY_TAXONOMY_MAP } = require("./shopify-taxonomy.map");


// Normaliza texto para matching estable
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s>]/g, "")
    .replace(/\s*>\s*/g, ">");
}

// Genera posibles claves desde intent
function buildKeys(intent) {
  const keys = [];

  const domain = normalize(intent.domain);
  const category = normalize(intent.category);
  const subcategory = normalize(intent.subcategory);
  const type = normalize(intent.type);

  // Nivel 1: path completo
  if (domain && category && subcategory && type) {
    keys.push(`${domain}>${category}>${subcategory}>${type}`);
  }

  // Nivel 2
  if (domain && category && subcategory) {
    keys.push(`${domain}>${category}>${subcategory}`);
  }

  // Nivel 3
  if (domain && category) {
    keys.push(`${domain}>${category}`);
  }

  // Nivel 4
  if (category && subcategory && type) {
    keys.push(`${category}>${subcategory}>${type}`);
  }

  return keys;
}

// Busca la mejor coincidencia
function mapToShopifyCategory(intent) {
  const keys = buildKeys(intent);

  for (const key of keys) {
    if (SHOPIFY_TAXONOMY_MAP[key]) {
      return {
        product_category: SHOPIFY_TAXONOMY_MAP[key],
        match_key: key,
        source: "exact",
        confidence: 0.95
      };
    }
  }

  // 🔥 FALLBACK INTELIGENTE
if (intent.category && intent.category !== "General") {
  return {
    product_category: "gid://shopify/ProductTaxonomyNode/640",
    match_key: "fallback_domain",
    source: "fallback",
    confidence: 0.4
  };
}

// 🔥 DEFAULT FINAL (SIEMPRE VALIDO PARA SHOPIFY)
return {
  product_category: "gid://shopify/ProductTaxonomyNode/1",
  match_key: "default",
  source: "default",
  confidence: 0.1
};
}

module.exports = {
  mapToShopifyCategory
};
