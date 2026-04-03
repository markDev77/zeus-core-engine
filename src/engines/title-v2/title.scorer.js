// /src/engines/title-v2/title.scorer.js

function scoreTitleContract(contract) {
  let score = 0;

  // ==========================
  // CLARITY (CRÍTICO)
  // ==========================
  if (contract.product_type?.value) {
    score += 30;
  }

  // ==========================
  // PRIMARY INTENT
  // ==========================
  if (contract.primary_intent?.value) {
    score += 20;
  }

  // ==========================
  // KEY MODIFIERS (máx 3)
  // ==========================
  const keyModifiers = contract.key_modifiers || [];

  if (keyModifiers.length > 0) {
    score += Math.min(keyModifiers.length * 10, 30);
  }

  // ==========================
  // VARIANT SIGNAL
  // ==========================
  if (contract.variant_signal?.value) {
    score += 10;
  }

  // ==========================
  // COMPATIBILITY (si aplica)
  // ==========================
  if ((contract.compatibility || []).length > 0) {
    score += 10;
  }

  // ==========================
  // PENALTIES
  // ==========================

  if (contract.anti_patterns?.repetition_risk) {
    score -= 15;
  }

  if (contract.anti_patterns?.keyword_stuffing_risk) {
    score -= 20;
  }

  if (contract.anti_patterns?.empty_adjectives) {
    score -= 10;
  }

  if (contract.risk_flags?.missing_product_type) {
    score -= 40;
  }

  if (contract.risk_flags?.ambiguous_product) {
    score -= 30;
  }

  if ((contract.key_modifiers || []).length > 3) {
    score -= 10;
  }

  // ==========================
  // NORMALIZACIÓN
  // ==========================
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return {
    total_score: score
  };
}

module.exports = {
  scoreTitleContract
};
