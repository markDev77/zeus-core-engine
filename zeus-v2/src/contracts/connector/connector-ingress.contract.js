// ZEUS v2 — Connector Ingress Contract
// Defines the structure of data entering ZEUS from a connector

const CONNECTOR_INGRESS_CONTRACT = Object.freeze({

  source: 'string',

  payload: Object,

  metadata: Object.freeze({
    received_at: 'string',
    connector_id: 'string'
  })

});

module.exports = CONNECTOR_INGRESS_CONTRACT;
