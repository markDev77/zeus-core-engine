// /src/policies/policy.engine.js

const usadropPolicy = require("./Shopify/usadrop.policy");

function resolvePolicy({ source, platform }) {

  const normalizedSource = String(source || "").toLowerCase();

  // ==========================
  // 🔧 DEFAULT BASE POLICY
  // ==========================
  const base = {
    name: "default",

    pricing: false,
    fallback_price: false,
    inventory_fixed: false,
    weight_fixed: false,
    description_mode: "standard",

    // 🔥 SAFE METHODS (NUNCA ROMPE)
    resolvePricing: ({ usd }) => {
      return Number(usd || 0);
    },

    resolveInventory: () => {
      return 0;
    }
  };

  // ==========================
  // 🔥 USADROP POLICY
  // ==========================
  if (platform === "shopify" && normalizedSource === "usadrop") {
    return {
      ...base,
      ...usadropPolicy,
      name: "usadrop"
    };
  }

  // ==========================
  // 🔄 FALLBACK
  // ==========================
  return base;
}

module.exports = {
  resolvePolicy
};
