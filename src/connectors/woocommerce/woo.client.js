const axios = require("axios");

const BASE_URL = "https://lo-tengo.com.mx/wp-json/wc/v3";

// 🔥 USAR QUERY AUTH (NO BASIC AUTH)
const CONSUMER_KEY = "ck_1f2ee08f6224be07d8f96a8cf2d72bc6be902f2e";
const CONSUMER_SECRET = "cs_18fa66ba79f1edaa0405cf8f763a6e86ee931519";

function buildUrl(path) {
  return `${BASE_URL}${path}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
}

async function getProduct(productId) {
  const url = buildUrl(`/products/${productId}`);
  const res = await axios.get(url);
  return res.data;
}

async function updateProduct(productId, payload) {
  const url = buildUrl(`/products/${productId}`);
  const res = await axios.put(url, payload);
  return res.data;
}

module.exports = {
  getProduct,
  updateProduct,
};
