// ZEUS v2 — Validation Result Contract
// Defines the structure of a validation result

const VALIDATION_RESULT_CONTRACT = Object.freeze({

  valid: 'boolean',

  errors: [
    Object.freeze({
      code: 'string',
      message: 'string',
      path: 'string | null'
    })
  ],

  metadata: Object.freeze({
    execution_id: 'string | null',
    stage: 'string | null',
    timestamp: 'string'
  })

});

module.exports = VALIDATION_RESULT_CONTRACT;
