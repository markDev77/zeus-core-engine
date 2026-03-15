/*
========================================
ZEUS SHOPIFY SYNC
========================================
Módulo único para actualizar productos
en Shopify desde ZEUS
========================================
*/

const axios = require("axios");

async function updateShopifyProduct({
  shopDomain,
  accessToken,
  productId,
  title,
  description,
  tags,
  productType
}) {

  if (!shopDomain || !productId) {
    throw new Error("Missing shopDomain or productId");
  }

  if (!accessToken) {
    throw new Error("Missing Shopify access token");
  }

  const url = `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`;

  const payload = {
    product: {
      id: productId,

      title: title || "",

      body_html: description || "",

      tags: Array.isArray(tags)
        ? tags.join(", ")
        : "",

      product_type:
        typeof productType === "object"
          ? productType?.name || "general"
          : productType || "general",

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

    console.log("ZEUS SHOPIFY SYNC START:", productId);

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

    console.log("ZEUS SHOPIFY SYNC COMPLETE:", productId);

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
