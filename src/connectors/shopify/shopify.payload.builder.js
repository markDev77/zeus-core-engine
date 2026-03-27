const { resolveShopifyCategory } = require("./category/shopify-category.resolver");

/**
 * Construye el payload final para Shopify
 */
function buildShopifyPayload({
  product,
  optimized,
  intent,
  policyOutput,
  clientRules
}) {
  // 🔹 CATEGORY
  const categoryResult = resolveShopifyCategory({
    intent,
    policyOverride: policyOutput?.categoryOverride || null,
    clientOverride: clientRules?.categoryOverride || null
  });

  // 🔹 VENDOR (SALE DE POLICY)
  const vendor = policyOutput?.vendor || product.vendor || "Unknown";

  // 🔹 BASE PAYLOAD (NO ROMPER LO EXISTENTE)
  const payload = {
  title: optimized.title,
  body_html: optimized.body_html,
  tags: optimized.tags,
  vendor,

  // 🔥 HACK SHOPIFY (VISIBLE CATEGORY)
  product_type: null // se asigna abajo
};

  // 🔹 CATEGORY SHOPIFY (SOLO SI EXISTE)
  if (categoryResult.product_category) {
  payload.product_category = categoryResult.product_category;

  // 🔥 CLAVE: esto es lo que Shopify SÍ muestra
  payload.product_type = categoryResult.product_category;
}

  // 🔹 DEBUG OPCIONAL
  payload.metafields = [
    {
      namespace: "zeus",
      key: "category_source",
      value: categoryResult.source,
      type: "single_line_text_field"
    }
  ];

  return payload;
}

module.exports = {
  buildShopifyPayload
};
