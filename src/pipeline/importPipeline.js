const { transformProduct } = require("../services/productTransformer");
const categoryBrain = require("../services/categoryBrain");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");
const { syncProduct } = require("../services/syncEngine");
const { getStore } = require("../services/storeRegistry");

/*
====================================================
ZEUS IMPORT PIPELINE
====================================================
Flujo:

Input
↓
Transformer
↓
Category Brain
↓
Regional Mapping
↓
Sync Engine
====================================================
*/

async function runImportPipeline(input) {

  if (!input) {
    throw new Error("ZEUS PIPELINE: input missing");
  }

  /*
  ==========================================
  DEBUG INPUT
  ==========================================
  */

  console.log("ZEUS PIPELINE RAW INPUT:");
  console.log(JSON.stringify(input, null, 2));

  /*
  ==========================================
  TRANSFORM PRODUCT
  ==========================================
  */

  const transformed = transformProduct(input);

  /*
  ==========================================
  CATEGORY BRAIN
  ==========================================
  */

  const classification = await categoryBrain.suggestCategory({
    title: transformed.title,
    description: transformed.description,
    tags: transformed.tags
  });

  const baseCategory = classification.category;
  const confidence = classification.confidence;

  /*
  ==========================================
  REGIONAL CATEGORY MAPPING
  ==========================================
  */

  const regionalCategory = mapRegionalCategory({
    baseCategory,
    storeProfile: input.storeProfile
  });

  /*
  ==========================================
  FINAL PRODUCT STRUCTURE
  ==========================================
  */

  const product = {
    ...transformed,
    baseCategory,
    regionalCategory,
    category: baseCategory,
    categoryConfidence: confidence
  };

  /*
  ==========================================
  PRODUCT ID DETECTION
  ==========================================
  */

  const productId =
    input.productId ||
    input.shopifyProductId ||
    input.id ||
    input.payload?.id ||
    input.data?.id ||
    input.product?.id ||
    input.store?.productId ||
    null;

  console.log("ZEUS DETECTED PRODUCT ID:", productId);

  if (!productId) {
    console.warn("ZEUS WARNING: productId not detected in pipeline input");
  }

  /*
  ==========================================
  STORE DETECTION
  ==========================================
  */

  const shopDomain =
    input.shopDomain ||
    input.store?.shopDomain ||
    input.store?.shop ||
    null;

  const registeredStore = shopDomain
    ? getStore(shopDomain)
    : null;

  if (input.accessToken) {
    console.warn(
      "ZEUS WARNING: top-level accessToken ignored in favor of OAuth store token"
    );
  }

  if (
    registeredStore?.accessToken &&
    input.store?.accessToken &&
    registeredStore.accessToken !== input.store.accessToken
  ) {
    console.warn(
      "ZEUS WARNING: incoming store token mismatch, using storeRegistry token for",
      shopDomain
    );
  }

  const store = {
    shopDomain,
    accessToken:
      registeredStore?.accessToken ||
      input.store?.accessToken ||
      null,
    productId
  };

  console.log("ZEUS STORE CONTEXT:", {
    shopDomain: store.shopDomain,
    accessToken: store.accessToken ? "[REDACTED_PRESENT]" : null,
    productId: store.productId
  });

  if (!store.shopDomain) {
    console.warn("ZEUS WARNING: shopDomain not detected in pipeline input");
  }

  if (!store.accessToken) {
    console.warn("ZEUS WARNING: OAuth accessToken not available for store sync");
  }

  /*
  ==========================================
  PLATFORM DETECTION
  ==========================================
  */

  const platform =
    input.platform ||
    input.store?.platform ||
    "shopify";

  /*
  ==========================================
  SYNC ENGINE
  ==========================================
  */

  try {

    console.log("ZEUS SYNC ENGINE START", productId);

    await syncProduct({
      platform,
      store,
      product
    });

    console.log("ZEUS SYNC ENGINE COMPLETE", productId);

  } catch (error) {

    console.error(
      "ZEUS PIPELINE SYNC ERROR:",
      error.message
    );

  }

  /*
  ==========================================
  RETURN RESULT
  ==========================================
  */

  return {
    product,
    baseCategory,
    regionalCategory,
    confidence
  };

}

module.exports = {
  runImportPipeline
};
