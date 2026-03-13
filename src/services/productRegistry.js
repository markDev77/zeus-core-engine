const registry = new Map()

function saveProduct(jobId, result) {

    registry.set(jobId, {
        jobId,
        engine: result.engine,
        originalTitle: result.originalTitle,
        optimizedTitle: result.optimizedTitle,
        suggestedTags: result.suggestedTags,
        suggestedCategory: result.suggestedCategory,
        categoryConfidence: result.categoryConfidence,
        createdAt: new Date().toISOString()
    })

}

function getProduct(jobId) {
    return registry.get(jobId)
}

function getAllProducts() {
    return Array.from(registry.values())
}

module.exports = {
    saveProduct,
    getProduct,
    getAllProducts
}
