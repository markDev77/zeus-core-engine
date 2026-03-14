const registry = new Map();

function saveProduct(jobId, result = {}) {
  const entry = {
    jobId,
    status: result.status || "processed",
    engine:
      result.engine ||
      (result.product && result.product.engine) ||
      "ZEUS",
    origin: result.origin || null,
    store: result.store || null,
    storeProfile: result.storeProfile || null,
    storeProfileResolution: result.storeProfileResolution || null,
    category:
      result.category ||
      (result.product && result.product.category) ||
      null,
    baseCategory:
      result.baseCategory ||
      (result.product && result.product.baseCategory) ||
      result.category ||
      null,
    regionalCategory:
      result.regionalCategory ||
      (result.product && result.product.regionalCategory) ||
      null,
    confidence:
      result.confidence ||
      (result.product && result.product.categoryConfidence) ||
      null,
    product: result.product || {
      originalTitle: result.originalTitle || null,
      optimizedTitle: result.optimizedTitle || null,
      suggestedTags: result.suggestedTags || [],
      suggestedCategory: result.suggestedCategory || null,
      suggestedRegionalCategory: result.suggestedRegionalCategory || null,
      baseCategory: result.baseCategory || null,
      regionalCategory: result.regionalCategory || null,
      categoryConfidence: result.categoryConfidence || null,
      title: result.title || null,
      description: result.description || null,
      tags: result.tags || [],
      category: result.category || null
    },
    createdAt: new Date().toISOString()
  };

  registry.set(String(jobId), entry);

  return entry;
}

function getProduct(jobId) {
  return registry.get(String(jobId));
}

function getAllProducts() {
  return Array.from(registry.values());
}

module.exports = {
  saveProduct,
  getProduct,
  getAllProducts
};
