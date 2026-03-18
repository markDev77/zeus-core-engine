/*
========================================
ZEUS SHOPIFY CONNECTOR
========================================
Recibe webhook Shopify
Normaliza producto
Valida acceso comercial
Envía a ZEUS Import Pipeline
========================================
*/

const fetch = require("node-fetch");

const normalizeShopifyProduct = require("./shopifyPayloadNormalizer");

const { isZeusUpdate } = require("../security/loopProtection");
const { getStore } = require("../services/storeRegistry");
const {
  getStoreAccessSnapshot
} = require("../services/storeAccessControl");

const ZEUS_CORE_URL =
  process.env.ZEUS_CORE_URL ||
  "http://localhost:10000";

function resolveShopDomain(payload = {}) {
  return (
    payload.shop_domain ||
    payload.shop ||
    process.env.SHOPIFY_STORE ||
    null
  );
}

async function processShopifyProduct(payload) {
  try {
    console.log("SHOPIFY CONNECTOR START");

    /*
    LOOP PROTECTION
    */

    if (isZeusUpdate(payload)) {
      console.log("ZEUS LOOP DETECTED");

      return {
        status: "ignored",
        reason: "zeus-update"
      };
    }

    const shopDomain = resolveShopDomain(payload);
    const registeredStore = getStore(shopDomain);

    if (!registeredStore) {
      console.warn("ZEUS STORE NOT REGISTERED:", shopDomain);

      return {
        status: "blocked",
        reason: "store_not_registered",
        shopDomain,
        productId: payload?.id || null
      };
    }

    const accessSnapshot =
      getStoreAccessSnapshot(shopDomain);

    if (!accessSnapshot.allowed) {
      console.warn(
        "ZEUS STORE ACCESS BLOCKED:",
        accessSnapshot
      );

      return {
        status: "blocked",
        reason: accessSnapshot.code,
        shopDomain,
        plan: accessSnapshot.plan || null,
        billingStatus: accessSnapshot.status || null,
        skuLimit: accessSnapshot.skuLimit || 0,
        used: accessSnapshot.used || 0,
        remaining: accessSnapshot.remaining || 0,
        productId: payload?.id || null
      };
    }

    /*
    NORMALIZE PAYLOAD
    */

    const normalizedProduct =
      normalizeShopifyProduct(payload);

    /*
    BUILD PIPELINE INPUT
    */

    const pipelineInput = {
      title: normalizedProduct.title,
      description: normalizedProduct.description,
      tags: normalizedProduct.tags,
      platform: "shopify",
      store: {
        shopDomain: registeredStore.shopDomain,
        accessToken: registeredStore.accessToken,
        productId: payload.id
      },
      storeProfile: {
        ...(registeredStore.profile || {}),
        shopDomain: registeredStore.shopDomain
      },
      source: "shopify"
    };

    /*
    SEND TO PIPELINE
    */

    const response = await fetch(
      `${ZEUS_CORE_URL}/import/product`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(pipelineInput)
      }
    );

    let result = null;

    try {
      result = await response.json();
    } catch (parseError) {
      console.error(
        "SHOPIFY CONNECTOR RESPONSE PARSE ERROR",
        parseError.message
      );
    }

    if (!response.ok) {
      console.error(
        "SHOPIFY CONNECTOR PIPELINE HTTP ERROR",
        response.status,
        result
      );

      return {
        status: "error",
        reason: "pipeline_http_error",
        httpStatus: response.status,
        productId: payload.id,
        shopDomain: registeredStore.shopDomain,
        result
      };
    }

    console.log("ZEUS PIPELINE RESULT", result);

    return {
      status: "processed",
      productId: payload.id,
      shopDomain: registeredStore.shopDomain,
      result
    };
  } catch (err) {
    console.error("SHOPIFY CONNECTOR ERROR", err);

    return {
      status: "error",
      message: err.message
    };
  }
}

module.exports = {
  processShopifyProduct
};
