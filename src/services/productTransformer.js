/*
========================================
ZEUS PRODUCT TRANSFORMER
========================================
Orquesta todo el pipeline de optimización
sin contener lógica pesada.

Servicios conectados:

regionalTitleOptimizer
regionalDescriptionOptimizer
regionalTagGenerator
marketSignalEngine
========================================
*/

const { optimizeRegionalTitle } = require("./regionalTitleOptimizer")
const { optimizeRegionalDescription } = require("./regionalDescriptionOptimizer")
const { generateRegionalTags } = require("./regionalTagGenerator")
const { detectMarketSignals } = require("./marketSignalEngine")

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

  const source = `${title} ${description}`.toLowerCase()

  const features = []
  const benefits = []

  if (source.includes("wireless") || source.includes("inalámbrico")) {
    features.push("Tecnología inalámbrica")
  }

  if (source.includes("rechargeable") || source.includes("recargable")) {
    features.push("Batería recargable")
  }

  if (source.includes("remote")) {
    features.push("Control remoto incluido")
  }

  if (source.includes("electric")) {
    features.push("Sistema eléctrico de entrenamiento")
  }

  if (features.length) {

    benefits.push("Mayor libertad de movimiento para el entrenamiento.")
    benefits.push("Reduce costos al no requerir baterías desechables.")
    benefits.push("Permite controlar el entrenamiento a distancia.")

  }

  return {
    features,
    benefits,
    attributes: {
      petType: "dog",
      connectivity: "wireless",
      power: "rechargeable"
    }
  }

}

function transformProduct(input = {}, storeProfile = {}) {

  const originalTitle = normalize(input.title)
  const description = normalize(input.description)

  const categoryData = detectCategory(originalTitle, description)

  const regionalTitle = optimizeRegionalTitle({
    translatedTitle: originalTitle,
    translatedDescription: description,
    storeProfile,
    category: categoryData.category
  })

  const seoDescription = optimizeRegionalDescription({
    title: regionalTitle,
    description,
    storeProfile
  })

  const tags = generateRegionalTags({
    title: regionalTitle,
    description,
    category: categoryData.category
  })

  const marketSignal = detectMarketSignals({
    title: regionalTitle,
    description
  })

  const intelligence = generateProductIntelligence(regionalTitle, description)

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
