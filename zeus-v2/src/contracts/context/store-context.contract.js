// ZEUS v2 — Store Context Contract
// Defines explicit, non-inferable store context structure

const STORE_CONTEXT_CONTRACT = Object.freeze({

  platform: 'string',

  locale: Object.freeze({
    language: 'string',
    region: 'string | null'
  }),

  currency: 'string',

  policy_key: 'string',

  channel: 'string | null',

  configuration: Object.freeze({
    pricing_strategy: 'string | null',
    inventory_strategy: 'string | null',
    content_mode: 'string | null'
  })

});

module.exports = STORE_CONTEXT_CONTRACT;
