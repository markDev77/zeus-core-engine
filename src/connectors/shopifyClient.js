/*
========================================
SHOPIFY ADMIN API CLIENT (MULTI-STORE FIX)
========================================
*/

const fetch = require("node-fetch");

/*
----------------------------------------
HELPER: RESOLVE ACCESS TOKEN
----------------------------------------
*/

function resolveAccessToken(store) {
  return store?.accessToken || store?.access_token || null;
}

/*
----------------------------------------
UPDATE PRODUCT
----------------------------------------
*/

async function updateProduct(store, productId, data) {

  if (!store || !store.shop) {
    throw new Error("STORE INVALID OR NOT PROVIDED");
  }

  const accessToken = resolveAccessToken(store);

  if (!accessToken) {
    throw new Error("NO ACCESS TOKEN FOUND IN STORE");
  }

  const url = `https://${store.shop}/admin/api/2024-01/products/${productId}.json`;

  const payload = {
    product: {
      id: productId,
      title: data.title,
      body_html: data.description,
      tags: (data.tags || []).join(",")
    }
  };

  console.log("SHOPIFY REQUEST DEBUG:", {
    shop: store.shop,
    hasToken: !!accessToken
  });

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();

  let parsed;

  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    parsed = responseText;
  }

  if (!response.ok) {
    console.error("SHOPIFY API ERROR:", parsed);
    throw new Error(JSON.stringify(parsed));
  }

  return parsed;
}

/*
----------------------------------------
EXPORTS
----------------------------------------
*/

module.exports = {
  updateProduct
};
