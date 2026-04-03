// /src/engines/title-v2/title.validator.js

function validateTitleContract(contract) {
  const errors = [];
  const warnings = [];

  // 🔹 PRODUCT TYPE (CRÍTICO)
  if (!contract.product_type?.value) {
    errors.push("missing_product_type");
  }

  if ((contract.product_type?.confidence || 0) < 0.5) {
    warnings.push("low_product_type_confidence");
  }

  // 🔹 MODIFIERS
  if ((contract.key_modifiers || []).length > 3) {
    warnings.push("too_many_key_modifiers");
  }

  // 🔹 REPETITION
  const values = [
    contract.product_type?.value,
    ...(contract.key_modifiers || []).map(m => m.value),
    contract.primary_intent?.value
  ].filter(Boolean);

  const duplicates = values.filter((v, i, arr) => arr.indexOf(v) !== i);

  if (duplicates.length > 0) {
    warnings.push("duplicate_terms");
  }

  // 🔹 INTENT
  if (!contract.primary_intent?.value) {
    warnings.push("missing_intent");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  validateTitleContract
};
