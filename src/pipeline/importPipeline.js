/**
 * ZEUS Import Pipeline
 * Handles product ingestion from external sources (USAdrop, etc)
 * and processes them through ZEUS optimization engine.
 */

const { transformProduct } = require("../services/productTransformer");
const { suggestCategory } = require("../services/categoryBrain");
const jobManager = require("../services/jobManager");
const productRegistry = require("../services/productRegistry");

async function processImport(productInput, source = "external") {

  const jobId = jobManager.createJob({
    source,
    status: "processing",
    timestamp: Date.now()
  });

  try {

    /**
     * STEP 1
     * Transform product through ZEUS Optimizer
     */

    const transformed = transformProduct(productInput);

    /**
     * STEP 2
     * Category Brain evaluation
     */

    const categoryResult = suggestCategory({
      title: transformed.optimizedTitle || transformed.title,
      description: transformed.description || "",
      tags: transformed.tags || []
    });

    /**
     * STEP 3
     * Apply business rules
     */

    let finalCategory = transformed.category;

    if (!transformed.category || transformed.category === "general") {
      finalCategory = categoryResult.category;
    }

    /**
     * STEP 4
     * Register product
     */

    const registryResult = productRegistry.registerProduct({
      source,
      title: transformed.title,
      category: finalCategory,
      timestamp: Date.now()
    });

    /**
     * STEP 5
     * Update job status
     */

    jobManager.updateJob(jobId, {
      status: "processed",
      completedAt: Date.now()
    });

    /**
     * STEP 6
     * Return pipeline result
     */

    return {
      jobId,
      status: "processed",
      origin: source,

      category: finalCategory,
      confidence: categoryResult.confidence,

      product: {
        engine: "ZEUS",

        originalTitle: transformed.originalTitle,
        optimizedTitle: transformed.optimizedTitle,

        suggestedTags: transformed.suggestedTags,

        suggestedCategory: categoryResult.category,
        categoryConfidence: categoryResult.confidence,

        title: transformed.title,
        description: transformed.description,
        tags: transformed.tags,

        category: finalCategory
      },

      registry: registryResult
    };

  } catch (error) {

    jobManager.updateJob(jobId, {
      status: "failed",
      error: error.message
    });

    return {
      jobId,
      status: "failed",
      error: error.message
    };
  }
}

module.exports = {
  processImport
};
