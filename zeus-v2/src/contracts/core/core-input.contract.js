// ZEUS v2 — Core Input Contract
// Defines the only valid structure that can enter the Core layer

const CORE_INPUT_CONTRACT = Object.freeze({

  product: Object.freeze({
    id: 'string',
    title: 'string',
    description_html: 'string',
    images: 'array',
    variants: 'array',
    category: 'string | null',
    source: 'string'
  }),

  metadata: Object.freeze({
    created_at: 'string | null',
    updated_at: 'string | null'
  })

});

module.exports = CORE_INPUT_CONTRACT;
