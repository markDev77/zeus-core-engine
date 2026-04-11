// ZEUS v2 — Execution Stage Contract
// Defines the structure of a valid execution stage

const EXECUTION_STAGE_CONTRACT = Object.freeze({

  name: 'string',

  input: Object,

  output: Object | null,

  status: Object.freeze({
    state: 'pending | processing | completed | failed'
  }),

  timestamps: Object.freeze({
    started_at: 'string',
    completed_at: 'string | null'
  })

});

module.exports = EXECUTION_STAGE_CONTRACT;
