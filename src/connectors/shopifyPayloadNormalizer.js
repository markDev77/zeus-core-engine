/*
========================================
SHOPIFY PAYLOAD NORMALIZER
Convierte payload de Shopify a formato ZEUS
========================================
*/

function normalizeShopifyProduct(payload) {

  const variants = payload.variants || [];

  return {

    source: "shopify",

    shopifyProductId: payload.id,

    title: payload.title || "",

    description: payload.body_html || "",

    vendor: payload.vendor || "",

    productType: payload.product_type || "",

    tags: payload.tags ? payload.tags.split(",") : [],

    variants: variants.map(v => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      inventory_quantity: v.inventory_quantity
    })),

    images: payload.images ? payload.images.map(img => img.src) : []

  };

}

module.exports = normalizeShopifyProduct;