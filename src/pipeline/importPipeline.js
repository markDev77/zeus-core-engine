const { transformProduct } = require("../services/productTransformer");
const categoryBrain = require("../services/categoryBrain");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");
const { syncProduct } = require("../services/syncEngine");

async function runImportPipeline(input) {

  /*
  Transform product
  */
  const transformed = transformProduct(input);

  /*
  Category Brain
  */
  const classification = await categoryBrain.suggestCategory({
    title: transformed.title,
    description: transformed.description,
    tags: transformed.tags
  });

  const baseCategory = classification.category;
  const confidence = classification.confidence;

  /*
  Regional category mapping
  */
  const regionalCategory = mapRegionalCategory({
    baseCategory,
    storeProfile: input.storeProfile
  });

  /*
  Final product
  */
  const product = {
    ...transformed,
    baseCategory,
    regionalCategory,
    category: baseCategory,
    categoryConfidence: confidence
  };

  /*
  Sync Engine
  */
  await syncProduct({
    platform: input.platform,
    store: input.store,
    product
  });

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
