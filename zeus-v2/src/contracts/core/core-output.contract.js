// ZEUS v2 — Core Output Contract
// Defines the only valid structure that can exit the Core layer

const CORE_OUTPUT_CONTRACT = Object.freeze({

  product: Object.freeze({
    title: 'string',
    description_html: 'string',
    tags: 'array | null',
    attributes: 'object | null'
  }),

  classification: Object.freeze({
    category: 'string | null',
    confidence: 'number | null'
  }),

  signals: Object.freeze({
    detected_intent: 'string | null',
    semantic_tokens: 'array | null'
  })

});

module.exports = CORE_OUTPUT_CONTRACT;
