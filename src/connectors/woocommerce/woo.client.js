const axios = require("axios");

// ==========================
// CONFIG
// ==========================
const BASE_URL = "https://lo-tengo.com.mx/wp-json/wc/v3";

const CONSUMER_KEY = "ck_1f2ee08f6224be07d8f96a8cf2d72bc6be902f2e";
const CONSUMER_SECRET = "cs_18fa66ba79f1edaa0405cf8f763a6e86ee931519";

// ==========================
// HELPERS
// ==========================
function buildUrl(path) {
  return `${BASE_URL}${path}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

// ==========================
// GET PRODUCT (NORMALIZADO)
// ==========================
async function getProduct(productId) {
  const url = buildUrl(`/products/${productId}`);

  const res = await axios.get(url);
  const data = res.data;

  console.log("📦 RAW RESPONSE WOO:", JSON.stringify(data).slice(0, 500));

  // 🔥 NORMALIZACIÓN (CRÍTICA)
  if (Array.isArray(data)) {
    return data[0];
  }

  if (data?.product) {
    return data.product;
  }

  return data;
}

// ==========================
// UPDATE PRODUCT
// ==========================
async function updateProduct(productId, payload) {
  const url = buildUrl(`/products/${productId}`);

  console.log("📤 UPDATE PAYLOAD:", payload);

  const res = await axios.put(url, payload);

  return res.data;
}

// ==========================
// EXPORT
// ==========================
module.exports = {
  getProduct,
  updateProduct,
};
