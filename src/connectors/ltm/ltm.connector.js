// src/connectors/ltm/ltm.connector.js

const axios = require("axios");

async function writeLTMProduct({ store, product, zeusResult }) {
  if (!store) throw new Error("store is required");
  if (!product) throw new Error("product is required");
  if (!zeusResult) throw new Error("zeusResult is required");

  console.log("🚀 LTM WRITE START", {
    productId: product.id
  });

  const payload = buildLTMPayload(product, zeusResult);

  // 🔒 ENDPOINT LTM (AJUSTAREMOS DESPUÉS)
  const endpoint = process.env.LTM_API_URL || "https://ltm-mx/api/products";

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.LTM_API_KEY || "test-key"
      }
    });

    console.log("✅ LTM WRITE SUCCESS", {
      productId: product.id
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error("❌ LTM WRITE ERROR", {
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

function buildLTMPayload(product, zeusResult) {
  return {
    external_id: product.id,
    name: zeusResult.title,
    description: zeusResult.description_html,
    short_description: zeusResult.short_description,
    tags: zeusResult.tags || [],
    images: product.images || [],
    variants: product.variants || []
  };
}

module.exports = {
  writeLTMProduct
};
