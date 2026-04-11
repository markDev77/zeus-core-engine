// ZEUS v2 — Policy Output Contract
// Defines the only valid structure that can exit the Policy layer

const POLICY_OUTPUT_CONTRACT = Object.freeze({

  product: Object,

  adjustments: Object.freeze({
    price: 'number | null',
    inventory: 'number | null'
  }),

  flags: Object.freeze({
    requires_review: 'boolean',
    restricted: 'boolean'
  }),

  metadata: Object.freeze({
    applied_policy: 'string',
    timestamp: 'string'
  })

});

module.exports = POLICY_OUTPUT_CONTRACT;
