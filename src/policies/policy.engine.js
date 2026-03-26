// /src/policies/policy.engine.js

function resolvePolicy({ source }) {

  // DEFAULT
  const base = {
    pricing: false,
    fallback_price: false,
    inventory_fixed: false,
    weight_fixed: false,
    description_mode: "standard"
  };

  // USADROP RULES
  if (source === "usadrop") {
    return {
      ...base,
      pricing: true,
      fallback_price: true,
      inventory_fixed: true,
      weight_fixed: true,
      description_mode: "hybrid"
    };
  }

  return base;
}

module.exports = {
  resolvePolicy
};
