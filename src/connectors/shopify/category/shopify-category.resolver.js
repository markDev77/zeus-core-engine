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

  if (mapped) {
    return mapped;
  }

  // 4. FALLBACK CONTROLADO
  return {
    product_category: null,
    source: "none",
    confidence: 0
  };
}

module.exports = {
  resolveShopifyCategory
};
