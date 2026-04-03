// /engines/title-v2/title.contract.js

function createEmptyTitleContract() {
  return {
    product_type: {
      value: "",
      confidence: 0
    },

    brand: {
      value: null,
      priority: "none" // high | medium | low | none
    },

    primary_intent: {
      value: "",
      type: "functional", // functional | contextual | compatibility | hybrid
      confidence: 0
    },

    key_modifiers: [],

    secondary_modifiers: [],

    compatibility: [],

    variant_signal: {
      value: null,
      type: null, // size | capacity | color | pack | dimension
      priority: "low" // high | medium | low
    },

    semantic_priority_order: [],

    candidate_titles: [],

    risk_flags: {
      missing_product_type: false,
      low_confidence: false,
      overloaded_modifiers: false,
      ambiguous_product: false
    },

    anti_patterns: {
      repetition_risk: false,
      keyword_stuffing_risk: false,
      empty_adjectives: false
    },

    locale_context: {
      language: "en",
      region: "GLOBAL"
    }
  };
}

function normalizeTitleContract(input = {}) {
  const base = createEmptyTitleContract();

  return {
    ...base,
    ...input,

    product_type: {
      ...base.product_type,
      ...(input.product_type || {})
    },

    brand: {
      ...base.brand,
      ...(input.brand || {})
    },

    primary_intent: {
      ...base.primary_intent,
      ...(input.primary_intent || {})
    },

    variant_signal: {
      ...base.variant_signal,
      ...(input.variant_signal || {})
    },

    risk_flags: {
      ...base.risk_flags,
      ...(input.risk_flags || {})
    },

    anti_patterns: {
      ...base.anti_patterns,
      ...(input.anti_patterns || {})
    },

    locale_context: {
      ...base.locale_context,
      ...(input.locale_context || {})
    },

    key_modifiers: Array.isArray(input.key_modifiers) ? input.key_modifiers : [],
    secondary_modifiers: Array.isArray(input.secondary_modifiers) ? input.secondary_modifiers : [],
    compatibility: Array.isArray(input.compatibility) ? input.compatibility : [],
    semantic_priority_order: Array.isArray(input.semantic_priority_order)
      ? input.semantic_priority_order
      : [],
    candidate_titles: Array.isArray(input.candidate_titles) ? input.candidate_titles : []
  };
}

module.exports = {
  createEmptyTitleContract,
  normalizeTitleContract
};
