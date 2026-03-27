const { mapToShopifyCategory } = require("./shopify-category.mapper");

function resolveShopifyCategory({
  intent,
  policyOverride = null,
  clientOverride = null
}) {
  // 1. CLIENT RULES (máxima prioridad)
  if (clientOverride && clientOverride.product_category) {
    return {
      product_category: clientOverride.product_category,
      source: "client_override",
      confidence: 1
    };
  }

  // 2. POLICY OVERRIDE
  if (policyOverride && policyOverride.product_category) {
    return {
      product_category: policyOverride.product_category,
      source: "policy_override",
      confidence: 1
    };
  }

  // 3. MAPPING ESTÁNDAR
  const mapped = mapToShopifyCategory(intent);

// 🔥 SIEMPRE DEVOLVER ALGO (NO NULL)
if (mapped && mapped.product_category) {
  return mapped;
}

// 🔥 FALLBACK FORZADO GLOBAL
return {
  product_category: "Miscellaneous",
  source: "forced_fallback",
  confidence: 0.2
};
}

module.exports = {
  resolveShopifyCategory
};
