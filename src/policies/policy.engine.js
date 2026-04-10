// /src/policies/policy.engine.js

const usadropPolicy = require("./Shopify/usadrop.policy");
const { ltmPolicy } = require("./woocommerce/ltm.policy");

/**
 * ==========================
 * 🧠 POLICY REGISTRY (NUEVO)
 * ==========================
 */
const POLICY_REGISTRY = {
  "ltm-mx": () => ltmPolicy({})
  // futuros:
  // "usadrop": () => usadropPolicy,
};

/**
 * ==========================
 * 🔧 DEFAULT BASE POLICY
 * ==========================
 */
function getBasePolicy() {
  return {
    name: "default",

    pricing: false,
    fallback_price: false,
    inventory_fixed: false,
    weight_fixed: false,
    description_mode: "standard",

    resolvePricing: ({ usd }) => {
      return Number(usd || 0);
    },

    resolveInventory: () => {
      return 0;
    }
  };
}

/**
 * ==========================
 * 🔍 RESOLVE POLICY
 * ==========================
 */
function resolvePolicy({ source, platform, store }) {

  const normalizedSource = String(source || "").toLowerCase();
  const storeId = store?.storeId || "";
  const policyKey = store?.policy_key || null;

  const base = getBasePolicy();

  // ==========================
  // 🟢 1. POLICY KEY (NUEVO CORE)
  // ==========================
  if (policyKey && POLICY_REGISTRY[policyKey]) {
    return {
      ...base,
      ...POLICY_REGISTRY[policyKey](),
      name: policyKey
    };
  }

  // ==========================
  // 🔥 2. USADROP (NO TOCAR)
  // ==========================
  if (platform === "shopify" && normalizedSource === "usadrop") {
    return {
      ...base,
      ...usadropPolicy,
      name: "usadrop"
    };
  }

  // ==========================
  // 🟡 3. LTM LEGACY (NO ROMPER)
  // ==========================
  if (platform === "woocommerce" && storeId === "ltm-mx") {
    return {
      ...base,
      ...ltmPolicy({}),
      name: "ltm-mx"
    };
  }

  // ==========================
  // 🔄 4. DEFAULT
  // ==========================
  return base;
}

module.exports = {
  resolvePolicy
};
