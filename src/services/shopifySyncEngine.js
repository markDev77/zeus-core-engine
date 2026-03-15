const axios = require("axios");

async function updateShopifyProduct(store, productId, productData) {

  const shop = store.shop;
  const token = store.accessToken;

  const url = `https://${shop}/admin/api/2024-01/products/${productId}.json`;

  const payload = {
    product: {
      id: productId,

      title: productData.title,

      body_html: productData.description,

      tags: Array.isArray(productData.tags)
        ? productData.tags.join(", ")
        : "",

      product_type:
        typeof productData.category === "object"
          ? productData.category?.name || "general"
          : productData.category || "general",

      metafields: [
        {
          namespace: "zeus",
          key: "optimized",
          type: "boolean",
          value: "true"
        }
      ]
    }
  };

  try {

    console.log("ZEUS SYNC START:", productId);

    const response = await axios.put(
      url,
      payload,
      {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("ZEUS SYNC COMPLETE:", productId);

    return response.data;

  } catch (error) {

    console.error(
      "SHOPIFY UPDATE ERROR:",
      error.response?.data || error.message
    );

    throw error;

  }

}

module.exports = {
  updateShopifyProduct
};
