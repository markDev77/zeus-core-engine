// ============================================
// ZEUS POLICY ENGINE
// Applies business rules depending on origin
// ============================================

// --------------------------------------------

function applyPolicy(product, origin) {

  if (!product) {
    return product;
  }

  let updatedProduct = { ...product };

  // ----------------------------------------
  // USADROP POLICY
  // ----------------------------------------

  if (origin === "usadrop") {

    // inventory initialization rule
    if (updatedProduct.variants && Array.isArray(updatedProduct.variants)) {

      updatedProduct.variants = updatedProduct.variants.map(variant => {

        return {
          ...variant,
          inventory: variant.inventory || 11
        };

      });

    }

  }

  // ----------------------------------------
  // NATIVE STORE PRODUCTS
  // ----------------------------------------

  if (
    origin === "shopify_native" ||
    origin === "woo_native"
  ) {

    return updatedProduct;

  }

  // ----------------------------------------
  // OTHER SUPPLIERS
  // ----------------------------------------

  if (origin === "supplier_api") {

    return updatedProduct;

  }

  return updatedProduct;

}

module.exports = applyPolicy;
