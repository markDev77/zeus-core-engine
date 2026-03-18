/*
====================================================
ZEUS LOOP PROTECTION
====================================================
Evita loops:
1) En memoria (TTL)
2) Persistente (Shopify metafields)
====================================================
*/

const axios = require("axios");

const zeusUpdates = new Map();

/*
====================================================
CHECK IF PRODUCT UPDATED BY ZEUS (MEMORY)
====================================================
*/

function isZeusUpdate(product) {

  try {

    if (!product) return false;

    const id = product.id;

    if (!id) return false;

    if (zeusUpdates.has(id)) {
      return true;
    }

    return false;

  } catch (error) {

    console.log("LOOP CHECK ERROR:", error.message);
    return false;

  }

}

/*
====================================================
MARK PRODUCT UPDATED BY ZEUS (MEMORY)
====================================================
*/

function markZeusUpdate(productId) {

  try {

    if (!productId) return;

    zeusUpdates.set(productId, Date.now());

    setTimeout(() => {
      zeusUpdates.delete(productId);
    }, 30000);

  } catch (error) {

    console.log("LOOP MARK ERROR:", error.message);

  }

}

/*
====================================================
PERSISTENT LOOP PROTECTION (SHOPIFY)
====================================================
*/

const ZEUS_NAMESPACE = "zeus";
const ZEUS_KEY = "processed";

/*
====================================================
CHECK IF ALREADY PROCESSED (SHOPIFY)
====================================================
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

    return metafields.some(
      m => m.namespace === ZEUS_NAMESPACE && m.key === ZEUS_KEY
    );

  } catch (error) {

    console.error("ZEUS LOOP CHECK ERROR:", error.message);
    return false;

  }

}

/*
====================================================
MARK AS PROCESSED (SHOPIFY)
====================================================
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

    console.error("ZEUS LOOP MARK ERROR:", error.message);

  }

}

/*
====================================================
EXPORTS (BACKWARD + FORWARD COMPATIBLE)
====================================================
*/

module.exports = {
  isZeusUpdate,
  markZeusUpdate,
  checkZeusProcessed,
  markZeusProcessed
};
