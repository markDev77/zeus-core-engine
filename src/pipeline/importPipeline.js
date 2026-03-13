// ============================================
// ZEUS IMPORT PIPELINE
// ============================================

const fetch = require("node-fetch");

// SERVICES
const { transformProduct } = require("../services/productTransformer");
const optimizeTitle = require("../services/titleOptimizer");
const { generateTags } = require("../services/tagGenerator");
const suggestCategory = require("../services/categorySuggestor");
const { checkSkuLimit } = require("../services/skuLimiter");
const productRegistry = require("../services/productRegistry");

// INTERNAL MODULES
const detectOrigin = require("./originDetector");
const applyPolicy = require("./policyEngine");

// CATEGORY BRAIN
const CATEGORY_BRAIN_URL = process.env.CATEGORY_BRAIN_URL;


// ============================================
// CATEGORY BRAIN CALL
// ============================================

async function callCategoryBrain(product) {

  try {

    if (!CATEGORY_BRAIN_URL) {
      return {
        category: product.suggestedCategory || null,
        confidence: 0
      };
    }

    const response = await fetch(`${CATEGORY_BRAIN_URL}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: product.title,
        description: product.description,
        tags: product.tags || []
      })
    });

    const data = await response.json();

    return {
      category: data.finalCategory,
      confidence: data.confidence
    };

  }

  catch (err) {

    console.error("CATEGORY BRAIN ERROR:", err);

    return {
      category: product.suggestedCategory || null,
      confidence: 0
    };

  }

}


// ============================================
// IMPORT PIPELINE
// ============================================

async function importPipeline(payload, jobId) {

  try {

    const origin = detectOrigin(payload);
    payload.origin = origin;

    let product = applyPolicy(payload, origin);

    product = transformProduct(product);

    product.title = optimizeTitle(product.title);

    product.tags = generateTags(product.title);

    const user = {
      optimized_skus: 0,
      sku_limit: 100
    };

    const limitCheck = checkSkuLimit(user);

    if (!limitCheck.allowed) {
      throw new Error("SKU limit reached");
    }

    const suggestion = suggestCategory(product);

    product.suggestedCategory = suggestion.suggestedCategory;

    const categoryResult = await callCategoryBrain(product);

    product.category = categoryResult.category;
    product.categoryConfidence = categoryResult.confidence;

    productRegistry.saveProduct(jobId, product);

    return {
      jobId: jobId,
      status: "processed",
      origin: origin,
      category: product.category,
      confidence: product.categoryConfidence,
      product: product
    };

  }

  catch (err) {

    console.error("IMPORT PIPELINE ERROR:", err);

    return {
      jobId: jobId,
      status: "error",
      error: err.message
    };

  }

}

module.exports = importPipeline;