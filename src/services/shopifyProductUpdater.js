const fetch = require("node-fetch");

function normalizeProductType(value) {

  if (!value) return "general";

  if (typeof value === "string") return value;

  if (typeof value === "object") {

    if (value.regionalCategory) return value.regionalCategory;

    if (value.baseCategory) return value.baseCategory;

    if (value.name) return value.name;

  }

  return "general";
}

async function updateShopifyProduct(shop, accessToken, productId, updates) {

  try {

    /*
    =========================================
    NORMALIZE product_type
    =========================================
    */

    if (updates.product_type) {
      updates.product_type = normalizeProductType(updates.product_type);
    }

    if (updates.category) {
      updates.product_type = normalizeProductType(updates.category);
      delete updates.category;
    }

    const payload = {
      product: {
        id: productId,
        ...updates
      }
    };

    console.log("ZEUS SHOPIFY PAYLOAD:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/products/${productId}.json`,
      {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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
