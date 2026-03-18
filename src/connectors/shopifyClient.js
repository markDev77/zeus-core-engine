/*
========================================
SHOPIFY ADMIN API CLIENT
========================================
*/

const fetch = require("node-fetch");

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function updateProduct(productId, data) {

  const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${productId}.json`;

  const payload = {
    product: {
      id: productId,
      title: data.title,
      body_html: data.description,
      tags: (data.tags || []).join(",")
    }
  };

  const response = await fetch(url, {

    method: "PUT",

    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN
    },

    body: JSON.stringify(payload)

  });

  return response.json();

}

module.exports = {
  updateProduct
};