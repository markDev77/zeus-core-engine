/*
========================================
ZEUS Market Signal Engine
Detecta señales de tendencia de mercado
========================================
*/

function applyMarketSignals(product = {}) {

  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase()

  let score = 0

  const keywords = [
    "wireless",
    "smart",
    "portable",
    "rechargeable",
    "recargable",
    "entrenamiento",
    "training",
    "eco",
    "solar",
    "automatic"
  ]

  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 0.15
    }
  })

  if (score > 1) score = 1

  return {
    ...product,
    trendScore: score
  }

}

/*
========================================
Pipeline Adapter
Usado por Import Pipeline
========================================
*/

function detectMarketSignal({ title = "", description = "" } = {}) {

  const text = `${title} ${description}`.toLowerCase()

  let score = 0

  const keywords = [
    "wireless",
    "rechargeable",
    "recargable",
    "training",
    "entrenamiento",
    "smart",
    "portable"
  ]

  keywords.forEach(k => {
    if (text.includes(k)) score += 0.15
  })

  if (score > 1) score = 1

  return {
    score
  }

}

module.exports = {
  applyMarketSignals,
  detectMarketSignal
}
