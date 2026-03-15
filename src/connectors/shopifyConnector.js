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
    */

    if (isZeusUpdate(payload)) {

      console.log("ZEUS LOOP PROTECTION ACTIVATED");

      return {
        status: "ignored",
        reason: "zeus-update"
      };

    }

    /*
    1 NORMALIZE SHOPIFY PAYLOAD
    */

    const normalizedProduct = normalizeShopifyProduct(payload);

    console.log("NORMALIZED PRODUCT:", normalizedProduct);

    /*
    ========================================
    BUILD PIPELINE INPUT
    ========================================
    */

    const shopDomain = payload?.admin_graphql_api_id
      ? payload.admin_graphql_api_id.split("/")[3]
      : null;

    const pipelineInput = {

      title: normalizedProduct.title,
      description: normalizedProduct.description,
      tags: normalizedProduct.tags || [],

      country: "US",

      platform: "shopify",

      store: {
        shopDomain: payload?.shop_domain || process.env.SHOPIFY_STORE_DOMAIN,
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        productId: payload.id
      },

      source: "shopify"

    };

    /*
    ========================================
    SEND TO ZEUS PIPELINE
    ========================================
    */

    const response = await fetch(`${ZEUS_CORE_URL}/import/product`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(pipelineInput)

    });

    const zeusResult = await response.json();

    console.log("ZEUS PIPELINE RESULT:", zeusResult);

    if (!zeusResult.product) {
      throw new Error("Invalid ZEUS response");
    }

    const optimizedProduct = zeusResult.product;

    /*
    ========================================
    MARK PRODUCT AS ZEUS OPTIMIZED
    ========================================
    */

    optimizedProduct.tags = optimizedProduct.tags || [];
    optimizedProduct.tags.push("zeus-optimized");

    /*
    ========================================
    UPDATE SHOPIFY PRODUCT
    ========================================
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
