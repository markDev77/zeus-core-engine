/*
========================================
ZEUS SHOPIFY SYNC SERVICE
========================================
Actualiza productos en Shopify
con datos optimizados por ZEUS
========================================
*/

const fetch = require("node-fetch");

async function updateShopifyProduct({
  shopDomain,
  accessToken,
  productId,
  title,
  description,
  tags,
  productType
}) {

  /*
  ========================================
  VALIDACIÓN BÁSICA
  ========================================
  */

  if (!shopDomain || !productId) {
    throw new Error("Missing Shopify store or productId for sync");
  }

  /*
  ========================================
  TEST MODE
  ========================================
  */

  if (!accessToken || accessToken === "TEST") {

    console.log("ZEUS TEST MODE — Shopify sync skipped");

    return {
      status: "test-mode",
      shopDomain,
      productId,
      productPreview: {
        title,
        description,
        tags,
        productType
      }
    };

  }

  /*
  ========================================
  SHOPIFY API URL
  ========================================
  */

  const url = `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`;

  /*
  ========================================
  PAYLOAD
  ========================================
  */

  const payload = {
    product: {
      id: productId,
      title: title,
      body_html: description,
      tags: Array.isArray(tags) ? tags.join(", ") : "",
      product_type: productType
    }
  };

  /*
  ========================================
  REQUEST
  ========================================
  */

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify(payload)
  });

  /*
  ========================================
  ERROR HANDLING
  ========================================
  */

  if (!response.ok) {

    const text = await response.text();

    throw new Error(`Shopify sync failed: ${text}`);

  }

  const data = await response.json();

  console.log("SHOPIFY PRODUCT UPDATED:", data.product.id);

  return data;

}

module.exports = {
  updateShopifyProduct
};
