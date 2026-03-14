/*
========================================
ZEUS SHOPIFY CONNECTOR
========================================
*/

const fetch = require("node-fetch");

const normalizeShopifyProduct = require("./shopifyPayloadNormalizer");
const { updateProduct } = require("./shopifyClient");

/*
LOOP PROTECTION
*/
const { isZeusUpdate } = require("../security/loopProtection");

const ZEUS_CORE_URL = process.env.ZEUS_CORE_URL || "http://localhost:10000";


async function processShopifyProduct(payload) {

  try {

    console.log("SHOPIFY CONNECTOR START");

    /*
    LOOP PROTECTION
    Evita reprocesar productos modificados por ZEUS
    */

    if (isZeusUpdate(payload)) {

      console.log("ZEUS LOOP PROTECTION ACTIVATED");

      return {
        status: "ignored",
        reason: "zeus-update"
      };

    }

    /*
    1 NORMALIZAR PAYLOAD SHOPIFY
    */

    const normalizedProduct = normalizeShopifyProduct(payload);

    console.log("NORMALIZED PRODUCT:", normalizedProduct);

    /*
    2 ENVIAR A ZEUS PIPELINE
    */

    const response = await fetch(`${ZEUS_CORE_URL}/import/product`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(normalizedProduct)

    });

    const zeusResult = await response.json();

    console.log("ZEUS PIPELINE RESULT:", zeusResult);

    if (!zeusResult.product) {
      throw new Error("Invalid ZEUS response");
    }

    const optimizedProduct = zeusResult.product;

    /*
    3 MARCAR PRODUCTO COMO OPTIMIZADO POR ZEUS
    */

    optimizedProduct.tags = optimizedProduct.tags || [];
    optimizedProduct.tags.push("zeus-optimized");

    /*
    4 ACTUALIZAR PRODUCTO EN SHOPIFY
    */

    await updateProduct(payload.id, optimizedProduct);

    console.log("SHOPIFY PRODUCT UPDATED");

    return {
      status: "updated",
      productId: payload.id
    };

  }

  catch (err) {

    console.error("SHOPIFY CONNECTOR ERROR:", err);

    return {
      status: "error",
      message: err.message
    };

  }

}

module.exports = {
  processShopifyProduct
};