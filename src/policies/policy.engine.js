// /src/policies/policy.engine.js

const usadropPolicy = require("./Shopify/usadrop.policy");
const { ltmPolicy } = require("./woocommerce/ltm.policy"); // 🔥 NUEVO

function resolvePolicy({ source, platform, store }) {

  const normalizedSource = String(source || "").toLowerCase();
  const storeId = store?.storeId || "";

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
  // 🔥 USADROP POLICY (NO TOCAR)
  // ==========================
  if (platform === "shopify" && normalizedSource === "usadrop") {
    return {
      ...base,
      ...usadropPolicy,
      name: "usadrop"
    };
  }

  // ==========================
  // 🟢 LTM-MX POLICY (POR STORE)
  // ==========================
  if (platform === "woocommerce" && storeId === "ltm-mx") {
    return {
      ...base,
      ...ltmPolicy({}),
      name: "ltm-mx"
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
