const { transformProduct } = require("../services/productTransformer");
const categoryBrain = require("../services/categoryBrain");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");
const { syncProduct } = require("../services/syncEngine");
const { getStore } = require("../services/storeRegistry");
const { aiSeoOptimizer } = require("../services/aiSeoOptimizer");
const { seoStructureBuilder } = require("../services/seoStructureBuilder");
const { generateProductSignature } = require("../services/productSignatureEngine");
const { registerProductSignature } = require("../services/productSignatureRegistry");

/*
====================================================
ZEUS IMPORT PIPELINE
====================================================
Flujo:

Input
↓
Transformer
↓
AI SEO Optimizer
↓
SEO Structure Builder
↓
Product Signature Engine
↓
Product Signature Registry
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

  console.log("ZEUS PIPELINE RAW INPUT:");
  console.log(JSON.stringify(input, null, 2));

  /*
  ==========================================
  TRANSFORM PRODUCT
  ==========================================
  */

  const transformed = transformProduct({
    ...input,
    storeProfile: input.storeProfile || {}
  });

  /*
  ==========================================
  AI SEO OPTIMIZER
  ==========================================
  */

  const aiOptimized = await aiSeoOptimizer(
    transformed,
    input.storeProfile || {}
  );

  /*
  ==========================================
  SEO STRUCTURE BUILDER
  ==========================================
  */

  const seoStructured = seoStructureBuilder(
    aiOptimized
  );

  /*
  ==========================================
  PRODUCT SIGNATURE ENGINE
  ==========================================
  */

  const signatureData = generateProductSignature(
    seoStructured
  );

  /*
  ==========================================
  PRODUCT SIGNATURE REGISTRY
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

  const shopDomain =
    input.shopDomain ||
    input.store?.shopDomain ||
    input.store?.shop ||
    null;

  const signatureRegistry = registerProductSignature({
    signature: signatureData.signature,
    shopDomain,
    productId
  });

  console.log("ZEUS PRODUCT SIGNATURE:", signatureData.signature);

  /*
  ==========================================
  CATEGORY BRAIN
  ==========================================
  */

  const classification = await categoryBrain.suggestCategory({
    title: seoStructured.title,
    description: seoStructured.description,
    tags: seoStructured.tags
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
    ...seoStructured,
    baseCategory,
    regionalCategory,
    category: baseCategory,
    categoryConfidence: confidence,
    productSignature: signatureData.signature
  };

  /*
  ==========================================
  STORE DETECTION
  ==========================================
  */

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
    confidence,
    signatureRegistry
  };

}

module.exports = {
  runImportPipeline
};
