// ============================================
// ZEUS ORIGIN DETECTOR
// Determines source of incoming product
// ============================================

function detectOrigin(product) {

  if (!product) {
    return "unknown";
  }

  // ----------------------------------------
  // USADROP DETECTION
  // ----------------------------------------

  if (
    product.source === "usadrop" ||
    product.vendor === "USAdrop" ||
    product.supplier === "usadrop" ||
    (product.sku && product.sku.startsWith("PD."))
  ) {
    return "usadrop";
  }

  // ----------------------------------------
  // SHOPIFY NATIVE
  // ----------------------------------------

  if (
    product.platform === "shopify" &&
    !product.supplier
  ) {
    return "shopify_native";
  }

  // ----------------------------------------
  // WOOCOMMERCE NATIVE
  // ----------------------------------------

  if (
    product.platform === "woocommerce" &&
    !product.supplier
  ) {
    return "woo_native";
  }

  // ----------------------------------------
  // GENERIC SUPPLIER
  // ----------------------------------------

  if (product.supplier) {
    return "supplier_api";
  }

  // ----------------------------------------
  // DEFAULT
  // ----------------------------------------

  return "unknown";

}

module.exports = detectOrigin;
