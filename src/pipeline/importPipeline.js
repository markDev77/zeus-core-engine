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

  if(!input) {
    throw new Error("ZEUS PIPELINE: input missing");
  }

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
    input.product?.id ||
    null;

  /*
  ==========================================
  STORE DETECTION
  ==========================================
  */

  const store = input.store || {};

  /*
  ==========================================
  PLATFORM DETECTION
  ==========================================
  */

  const platform =
    input.platform ||
    store.platform ||
    "shopify";

  /*
  ==========================================
  SYNC ENGINE
  ==========================================
  */

  try {

    await syncProduct({

      platform,

      store: {
        ...store,
        productId
      },

      product

    });

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
