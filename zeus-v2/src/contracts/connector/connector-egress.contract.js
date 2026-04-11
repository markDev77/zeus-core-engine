// ZEUS v2 — Connector Egress Contract
// Defines the structure of data leaving ZEUS to a connector

const CONNECTOR_EGRESS_CONTRACT = Object.freeze({

  destination: 'string',

  payload: Object,

  metadata: Object.freeze({
    sent_at: 'string',
    connector_id: 'string'
  })

});

module.exports = CONNECTOR_EGRESS_CONTRACT;
