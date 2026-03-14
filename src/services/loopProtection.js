const axios = require("axios");

/*
====================================================
CHECK IF PRODUCT UPDATED BY ZEUS
====================================================
*/

async function isZeusUpdate(store, productId) {

  const shop = store.shop;
  const token = store.accessToken;

  const url = `https://${shop}/admin/api/2024-01/products/${productId}/metafields.json`;

  try {

    const response = await axios.get(
      url,
      {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json"
        }
      }
    );

    const metafields = response.data.metafields || [];

    const zeusField = metafields.find(
      m => m.namespace === "zeus" && m.key === "updated"
    );

    if (!zeusField) {
      return false;
    }

    return zeusField.value === "true";

  } catch (error) {

    console.error("LOOP CHECK ERROR:", error.message);

    return false;

  }

}

/*
====================================================
MARK PRODUCT AS UPDATED BY ZEUS
====================================================
*/

async function markZeusUpdate(store, productId) {

  const shop = store.shop;
  const token = store.accessToken;

  const url = `https://${shop}/admin/api/2024-01/metafields.json`;

  const payload = {
    metafield: {
      namespace: "zeus",
      key: "updated",
      value: "true",
      type: "single_line_text_field",
      owner_resource: "product",
      owner_id: productId
    }
  };

  try {

    await axios.post(
      url,
      payload,
      {
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {

    console.error("LOOP MARK ERROR:", error.message);

  }

}

module.exports = {
  isZeusUpdate,
  markZeusUpdate
};