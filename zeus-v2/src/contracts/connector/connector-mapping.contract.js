// ZEUS v2 — Connector Mapping Contract
// Defines the allowed structure for mapping external data to ZEUS contracts

const CONNECTOR_MAPPING_CONTRACT = Object.freeze({

  input_mapping: Object,

  output_mapping: Object,

  rules: Object.freeze({
    allow_partial: 'boolean',
    strict_mode: 'boolean'
  })

});

module.exports = CONNECTOR_MAPPING_CONTRACT;
