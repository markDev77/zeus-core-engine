const { transformProduct } = require("../services/productTransformer");
const { suggestCategory } = require("../services/categoryBrain");
const { createJob } = require("../services/jobManager");
const productRegistry = require("../services/productRegistry");
const { resolveStoreProfile } = require("../services/storeProfileResolver");
const { mapRegionalCategory } = require("../services/regionalCategoryMapper");

async function importPipeline(productInput, jobId = null, source = "external", context = {}) {
  if (!jobId) {
    const job = createJob({
      source,
      status: "processing",
      timestamp: Date.now()
    });

    jobId = job.id;
  }

  try {
    const storeContext = resolveStoreProfile({
      payload: productInput,
      headers: context.headers || {}
    });

    const transformed = transformProduct({
      ...productInput,
      storeProfile: storeContext.profile,
      storeContext: storeContext.store
    });

    const categoryResult = suggestCategory({
      title: transformed.optimizedTitle || transformed.title || productInput.title || "",
      description: transformed.description || productInput.description || "",
      tags: transformed.tags || []
    });

    let finalCategory = transformed.category;

    if (!transformed.category || transformed.category === "general") {
      finalCategory = categoryResult.category;
    }

    const regionalCategoryMapping = mapRegionalCategory({
      baseCategory: finalCategory,
      storeProfile: storeContext.profile
    });

    const response = {
      jobId,
      status: "processed",
      origin: source,
      category: finalCategory,
      baseCategory: finalCategory,
      regionalCategory: regionalCategoryMapping.regionalCategory,
      confidence: categoryResult.confidence,
      store: storeContext.store,
      storeProfile: storeContext.profile,
      storeProfileResolution: storeContext.resolution,
      product: {
        engine: "ZEUS",
        originalTitle: transformed.originalTitle,
        optimizedTitle: transformed.optimizedTitle,
        suggestedTags: transformed.suggestedTags,
        suggestedCategory: categoryResult.category,
        suggestedRegionalCategory: regionalCategoryMapping.regionalCategory,
        baseCategory: finalCategory,
        regionalCategory: regionalCategoryMapping.regionalCategory,
        categoryConfidence: categoryResult.confidence,
        title: transformed.title,
        description: transformed.description,
        tags: transformed.tags,
        category: finalCategory
      }
    };

    const registryResult = productRegistry.saveProduct(jobId, response);

    return {
      ...response,
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
