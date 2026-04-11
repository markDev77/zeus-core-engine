// ZEUS v2 — Execution Envelope Contract
// Defines the unique container for a full execution cycle

const EXECUTION_ENVELOPE_CONTRACT = Object.freeze({

  execution_id: 'string',

  input: Object,

  context: Object,

  signals: Array,

  core_output: Object | null,

  policy_output: Object | null,

  status: Object.freeze({
    stage: 'string',
    state: 'pending | processing | completed | failed'
  }),

  timestamps: Object.freeze({
    started_at: 'string',
    completed_at: 'string | null'
  })

});

module.exports = EXECUTION_ENVELOPE_CONTRACT;
