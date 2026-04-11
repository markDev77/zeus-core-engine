// ZEUS v2 — Market Signals Contract
// Defines external signals as informational inputs only

const MARKET_SIGNALS_CONTRACT = Object.freeze({

  source: 'string',

  timestamp: 'string',

  signals: [
    Object.freeze({
      type: 'string',
      value: 'string | number | boolean | object | array',
      confidence: 'number | null'
    })
  ],

  metadata: Object.freeze({
    origin: 'string | null',
    version: 'string | null'
  })

});

module.exports = MARKET_SIGNALS_CONTRACT;
