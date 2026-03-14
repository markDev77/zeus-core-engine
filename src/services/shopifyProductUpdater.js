const fetch = require("node-fetch");

async function updateShopifyProduct(shop, accessToken, productId, updates) {

  try {

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/products/${productId}.json`,
      {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product: {
            id: productId,
            ...updates
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("SHOPIFY UPDATE ERROR:", data);
      return null;
    }

    console.log("SHOPIFY PRODUCT UPDATED:", productId);

    return data;

  } catch (error) {

    console.error("SHOPIFY PRODUCT UPDATE FAILED:", error);
    return null;

  }

}

module.exports = {
  updateShopifyProduct
};
