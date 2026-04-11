// ZEUS v2 — Policy Definition Contract
// Defines the required structure of a policy module

const POLICY_DEFINITION_CONTRACT = Object.freeze({

  policy_key: 'string',

  scope: Object.freeze({
    source: 'string | null',
    channel: 'string | null',
    region: 'string | null'
  }),

  rules: Object.freeze({
    pricing: 'function | null',
    inventory: 'function | null',
    content: 'function | null',
    compliance: 'function | null'
  }),

  constraints: Object.freeze({
    allow_partial: 'boolean',
    require_all_rules: 'boolean'
  })

});

module.exports = POLICY_DEFINITION_CONTRACT;
