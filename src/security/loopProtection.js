const axios = require("axios");

const ZEUS_NAMESPACE = "zeus";
const ZEUS_KEY = "processed";

/*
CHECK IF PRODUCT WAS PROCESSED BY ZEUS
*/

async function checkZeusProcessed(shop, accessToken, productId) {

  try {

    const url = `https://${shop}/admin/api/2024-01/products/${productId}/metafields.json`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });

    const metafields = response.data.metafields || [];

    const zeusField = metafields.find(
      m =>
        m.namespace === ZEUS_NAMESPACE &&
        m.key === ZEUS_KEY
    );

    return !!zeusField;

  } catch (error) {

    console.error("ZEUS LOOP CHECK ERROR", error.message);

    return false;

  }

}

/*
MARK PRODUCT AS PROCESSED BY ZEUS
*/

async function markZeusProcessed(shop, accessToken, productId) {

  try {

    const url = `https://${shop}/admin/api/2024-01/metafields.json`;

    await axios.post(url, {

      metafield: {

        namespace: ZEUS_NAMESPACE,
        key: ZEUS_KEY,
        value: "true",
        type: "single_line_text_field",
        owner_id: productId,
        owner_resource: "product"

      }

    }, {

      headers: {

        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"

      }

    });

  } catch (error) {

    console.error("ZEUS LOOP MARK ERROR", error.message);

  }

}

module.exports = {
  checkZeusProcessed,
  markZeusProcessed
};
