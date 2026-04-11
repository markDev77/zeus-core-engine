// ZEUS v2 — Policy Input Contract
// Defines the only valid structure that can enter the Policy layer

const POLICY_INPUT_CONTRACT = Object.freeze({

  core_output: Object,

  store_context: Object,

  signals: Array,

  metadata: Object.freeze({
    execution_id: 'string',
    timestamp: 'string'
  })

});

module.exports = POLICY_INPUT_CONTRACT;
