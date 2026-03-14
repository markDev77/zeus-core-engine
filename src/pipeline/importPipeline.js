/**
 * ZEUS Import Pipeline
 * Handles product ingestion from external sources (USAdrop, etc)
 * and processes them through ZEUS optimization engine.
 */

const { transformProduct } = require("../services/productTransformer");
const { suggestCategory } = require("../services/categoryBrain");
const { createJob, updateJob } = require("../services/jobManager");
const productRegistry = require("../services/productRegistry");

async function importPipeline(productInput, jobId = null, source = "external") {

  /*
  ====================================================
  CREATE JOB IF NOT PROVIDED
  ====================================================
  */

  if (!jobId) {

    const job = createJob({
      source,
      status: "processing",
      timestamp: Date.now()
    });

    jobId = job.id;

  }

  try {

    /*
    ====================================================
    STEP 1
    TRANSFORM PRODUCT THROUGH ZEUS OPTIMIZER
    ====================================================
    */

    const transformed = transformProduct(productInput);

    /*
    ====================================================
    STEP 2
    CATEGORY BRAIN EVALUATION
    ====================================================
    */

    const categoryResult = suggestCategory({
      title: transformed.optimizedTitle || transformed.title || productInput.title || "",
      description: transformed.description || productInput.description || "",
      tags: transformed.tags || []
    });

    /*
    ====================================================
    STEP 3
    APPLY BUSINESS RULES
    ====================================================
    */

    let finalCategory = transformed.category;

    if (!transformed.category || transformed.category === "general") {
      finalCategory = categoryResult.category;
    }

    /*
    ====================================================
    STEP 4
    REGISTER PRODUCT
    ====================================================
    */

    const registryResult = productRegistry.registerProduct({
      source,
      title: transformed.title,
      category: finalCategory,
      timestamp: Date.now()
    });

    /*
    ====================================================
    STEP 5
    UPDATE JOB STATUS
    ====================================================
    */

    updateJob(jobId, {
      status: "processed",
      completedAt: Date.now()
    });

    /*
    ====================================================
    STEP 6
    RETURN PIPELINE RESULT
    ====================================================
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

    if (jobId) {

      updateJob(jobId, {
        status: "failed",
        error: error.message
      });

    }

    return {

      jobId,
      status: "failed",
      error: error.message

    };

  }

}

module.exports = importPipeline;