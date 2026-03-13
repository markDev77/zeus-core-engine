// ============================================
// ZEUS IMPORT PIPELINE
// Orchestrates product import flow
// ============================================

// Services (existing)
const productTransformer = require("../services/productTransformer");
const titleOptimizer = require("../services/titleOptimizer");
const tagGenerator = require("../services/tagGenerator");
const categorySuggestor = require("../services/categorySuggestor");
const { checkSkuLimit } = require("../services/skuLimiter");
const productRegistry = require("../services/productRegistry");

// Internal modules
const detectOrigin = require("./originDetector");
const applyPolicy = require("./policyEngine");

// Category Brain endpoint
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
        tags: product.tags || [],
        attributes: product.attributes || {}
      })
    });

    const data = await response.json();

    return {
      category: data.finalCategory,
      confidence: data.confidence
    };

  } catch (err) {

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

    // ----------------------------------------
    // 1 ORIGIN DETECTION
    // ----------------------------------------

    const origin = detectOrigin(payload);

    payload.origin = origin;

    // ----------------------------------------
    // 2 POLICY LAYER
    // ----------------------------------------

    let product = applyPolicy(payload, origin);

    // ----------------------------------------
    // 3 TRANSFORM PRODUCT
    // ----------------------------------------

    product = await productTransformer(product);

    // ----------------------------------------
    // 4 OPTIMIZATION
    // ----------------------------------------

    product.title = await titleOptimizer(product.title);

    product.tags = await tagGenerator(product);

    // ----------------------------------------
    // 5 SKU LIMITER
    // ----------------------------------------

    const user = {
      optimized_skus: 0,
      sku_limit: 100
    };

    const limitCheck = checkSkuLimit(user);

    if (!limitCheck.allowed) {
      throw new Error("SKU limit reached");
    }

    // ----------------------------------------
    // 6 CATEGORY SUGGESTION
    // ----------------------------------------

    const suggestion = await categorySuggestor(product);

    product.suggestedCategory = suggestion.category;

    // ----------------------------------------
    // 7 CATEGORY BRAIN
    // ----------------------------------------

    const categoryResult = await callCategoryBrain(product);

    product.category = categoryResult.category;

    product.categoryConfidence = categoryResult.confidence;

    // ----------------------------------------
    // 8 REGISTRY
    // ----------------------------------------

    await productRegistry.register(product, jobId);

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return {

      jobId: jobId,
      status: "processed",
      origin: origin,
      category: product.category,
      confidence: product.categoryConfidence,
      product: product

    };

  } catch (err) {

    console.error("IMPORT PIPELINE ERROR:", err);

    return {
      jobId: jobId,
      status: "error",
      error: err.message
    };

  }

}

module.exports = importPipeline;
