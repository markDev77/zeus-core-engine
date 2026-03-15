const { transformProduct } = require("../services/productTransformer");
const categoryBrain = require("../services/categoryBrain");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");
const { syncProduct } = require("../services/syncEngine");

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

  const store = {
    shopDomain:
      input.shopDomain ||
      input.store?.shopDomain ||
      input.store?.shop ||
      null,

    accessToken:
      input.accessToken ||
      input.store?.accessToken ||
      process.env.SHOPIFY_ACCESS_TOKEN,

    productId
  };

  console.log("ZEUS STORE CONTEXT:", store);

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
