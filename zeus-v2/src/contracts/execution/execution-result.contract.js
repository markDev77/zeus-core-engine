// ZEUS v2 — Execution Result Contract
// Defines the final structure of an execution result

const EXECUTION_RESULT_CONTRACT = Object.freeze({

  execution_id: 'string',

  status: Object.freeze({
    state: 'completed | failed'
  }),

  output: Object | null,

  error: Object.freeze({
    code: 'string | null',
    message: 'string | null'
  }),

  timestamps: Object.freeze({
    started_at: 'string',
    completed_at: 'string'
  })

});

module.exports = EXECUTION_RESULT_CONTRACT;
