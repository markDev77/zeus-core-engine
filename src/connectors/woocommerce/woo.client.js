const axios = require("axios");

const BASE_URL = "https://lo-tengo.com.mx/wp-json/wc/v3";

const auth = {
  username: "ck_1f2ee08f6224be07d8f96a8cf2d72bc6be902f2e",
  password: "cs_18fa66ba79f1edaa0405cf8f763a6e86ee931519",
};

async function getProduct(productId) {
  const res = await axios.get(`${BASE_URL}/products/${productId}`, { auth });
  return res.data;
}

async function updateProduct(productId, payload) {
  const res = await axios.put(`${BASE_URL}/products/${productId}`, payload, { auth });
  return res.data;
}

module.exports = {
  getProduct,
  updateProduct,
};
