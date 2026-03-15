const axios = require("axios");
const { markZeusProcessed } = require("../../security/loopProtection");

/*
====================================================
SHOPIFY ADAPTER
ZEUS SYNC ENGINE
====================================================
*/

async function updateProduct({ store, product }) {

  if (!store) {
    throw new Error("SHOPIFY ADAPTER: store missing");
  }

  const shopDomain = store.shopDomain || store.shop;
  const accessToken = store.accessToken;
  const productId = store.productId;

  if (!shopDomain || !accessToken || !productId) {
    throw new Error("SHOPIFY ADAPTER: missing shop credentials");
  }

  const url = `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`;

  const payload = {

    product: {

      id: productId,

      title: product.title || product.optimizedTitle,

      body_html: product.description || product.body_html,

      tags: Array.isArray(product.tags)
        ? product.tags.join(", ")
        : product.tags,

      product_type:
        product.category ||
        product.baseCategory ||
        "general"

    }

  };

  try {

    const response = await axios.put(
      url,
      payload,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("ZEUS SHOPIFY UPDATE SUCCESS", productId);

    /*
    ==========================================
    LOOP PROTECTION MARK
    ==========================================
    */

    await markZeusProcessed(
      shopDomain,
      accessToken,
      productId
    );

    return response.data;

  } catch (error) {

    console.error(
      "ZEUS SHOPIFY UPDATE ERROR",
      error.response?.data || error.message
    );

    throw error;

  }

}

module.exports = {
  updateProduct
};
