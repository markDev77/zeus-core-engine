// ZEUS v2 — Validation Input Contract
// Defines the structure of data that enters validation gates

const VALIDATION_INPUT_CONTRACT = Object.freeze({

  type: 'string',

  payload: Object,

  metadata: Object.freeze({
    execution_id: 'string | null',
    stage: 'string | null',
    timestamp: 'string'
  })

});

module.exports = VALIDATION_INPUT_CONTRACT;
