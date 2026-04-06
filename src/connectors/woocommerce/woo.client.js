const axios = require("axios");

// ==========================
// CONFIG
// ==========================
const BASE_URL = "https://lo-tengo.com.mx/wp-json/wc/v3";

const CONSUMER_KEY = "ck_1f2ee08f6224be07d8f96a8cf2d72bc6be902f2e";
const CONSUMER_SECRET = "cs_18fa66ba79f1edaa0405cf8f763a6e86ee931519";

// ==========================
// AUTH HEADER
// ==========================
function getAuthHeader() {
  const token = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  return `Basic ${token}`;
}

// ==========================
// AXIOS INSTANCE
// ==========================
const wooApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

// ==========================
// GET PRODUCT
// ==========================
async function getProduct(productId) {
  try {
    console.log("🟡 GET PRODUCT START:", productId);

    const res = await wooApi.get(`/products/${productId}`);

    const data = res.data;

    console.log("📦 RAW RESPONSE WOO:", JSON.stringify(data).slice(0, 500));

    if (!data || typeof data !== "object") {
      throw new Error("Invalid product structure from Woo");
    }

    console.log("✅ GET PRODUCT OK:", data.id);

    return data;

  } catch (err) {
    console.error("❌ GET PRODUCT ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ==========================
// UPDATE PRODUCT
// ==========================
async function updateProduct(productId, payload) {
  try {
    console.log("🟡 UPDATE PRODUCT START:", productId);
    console.log("📤 UPDATE PAYLOAD:", JSON.stringify(payload));

    const res = await wooApi.put(`/products/${productId}`, payload);

    console.log("✅ UPDATE SUCCESS:", res.data?.id || "NO ID");

    return res.data;

  } catch (err) {
    console.error("❌ UPDATE PRODUCT ERROR:", err.response?.data || err.message);
    throw err;
  }
}

// ==========================
// EXPORT
// ==========================
module.exports = {
  getProduct,
  updateProduct,
};
