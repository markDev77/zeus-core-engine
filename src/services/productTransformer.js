const { detectMarketSignal } = require("./marketSignalEngine")
const { generateRegionalTitle } = require("./regionalTitleOptimizer")
const { generateDescription } = require("./regionalDescriptionOptimizer")

function normalize(text = "") {
  return String(text || "").trim()
}

function detectCategory(title = "", description = "") {

  const source = `${title} ${description}`.toLowerCase()

  if (
    source.includes("dog") ||
    source.includes("perro") ||
    source.includes("collar")
  ) {
    return {
      category: "pet_supplies",
      taxonomy: "Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Collars",
      confidence: 0.95
    }
  }

  return {
    category: "general",
    taxonomy: "General",
    confidence: 0.5
  }

}

function generateProductIntelligence(title = "", description = "") {

  const features = [
    "Tecnología inalámbrica",
    "Batería recargable",
    "Control remoto incluido",
    "Sistema eficiente de entrenamiento"
  ]

  const benefits = [
    "Mayor libertad de movimiento para el entrenamiento.",
    "Reduce costos al no requerir baterías desechables.",
    "Permite controlar el entrenamiento a distancia."
  ]

  const attributes = {
    petType: "dog",
    connectivity: "wireless",
    power: "rechargeable"
  }

  return {
    features,
    benefits,
    attributes
  }

}

function transformProduct(input = {}, storeProfile = {}) {

  const originalTitle = normalize(input.title)
  const originalDescription = normalize(input.description)

  const categoryData = detectCategory(originalTitle, originalDescription)

  const regionalTitle = generateRegionalTitle({
    title: originalTitle,
    country: storeProfile.country || "DEFAULT"
  })

  const seoDescription = generateDescription({
    title: regionalTitle,
    description: originalDescription,
    category: categoryData.category,
    country: storeProfile.country || "DEFAULT"
  })

  const marketSignal = detectMarketSignal({
    title: regionalTitle,
    description: seoDescription
  })

  const intelligence = generateProductIntelligence(
    regionalTitle,
    seoDescription
  )

  const tags = [
    "rechargeable",
    "training",
    "collar",
    "wireless",
    "pet",
    "dog"
  ]

  return {

    engine: "ZEUS",

    originalTitle: originalTitle,

    optimizedTitle: regionalTitle,

    suggestedTags: tags,

    suggestedCategory: categoryData.category,

    categoryConfidence: categoryData.confidence,

    title: regionalTitle,

    description: seoDescription,

    tags: tags,

    category: categoryData.category,

    taxonomy: categoryData.taxonomy,

    trendScore: marketSignal.score || 0,

    features: intelligence.features,

    benefits: intelligence.benefits,

    attributes: intelligence.attributes,

    baseCategory: categoryData.category,

    regionalCategory: {

      baseCategory: categoryData.category,

      regionalCategory: categoryData.category,

      marketplace: storeProfile.marketplace || "shopify",

      country: storeProfile.country || "DEFAULT"

    }

  }

}

module.exports = {
  transformProduct
}
