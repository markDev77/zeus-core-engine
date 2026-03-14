const { transformProduct } = require("../services/productTransformer");
const { suggestCategory } = require("../services/categoryBrain");
const { createJob } = require("../services/jobManager");
const productRegistry = require("../services/productRegistry");

async function importPipeline(productInput, jobId = null, source = "external") {

  if (!jobId) {
    const job = createJob({
      source,
      status: "processing",
      timestamp: Date.now()
    });

    jobId = job.id;
  }

  try {

    const transformed = transformProduct(productInput);

    const categoryResult = suggestCategory({
      title: transformed.optimizedTitle || transformed.title || productInput.title || "",
      description: transformed.description || productInput.description || "",
      tags: transformed.tags || []
    });

    let finalCategory = transformed.category;

    if (!transformed.category || transformed.category === "general") {
      finalCategory = categoryResult.category;
    }

    const registryResult = productRegistry.saveProduct(jobId, {
      source,
      title: transformed.title,
      category: finalCategory,
      timestamp: Date.now()
    });

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

    return {
      jobId,
      status: "failed",
      error: error.message
    };

  }

}

module.exports = importPipeline;
