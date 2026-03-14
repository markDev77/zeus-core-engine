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
      tags: productData.tags.join(", "),
      product_type: productData.category
    }
  };

  try {

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

    return response.data;

  } catch (error) {

    console.error("SHOPIFY UPDATE ERROR:", error.response?.data || error.message);

    throw error;
  }
}

module.exports = {
  updateShopifyProduct
};
