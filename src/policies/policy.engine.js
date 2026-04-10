// src/policies/policy.engine.js

const ltmPolicy = require("./woocommerce/ltm.policy");

/**
 * Registro de policies disponibles
 * Clave = policy_key
 */
const POLICY_REGISTRY = {
  "ltm-mx": ltmPolicy,

  // futuros:
  // "usadrop": usadropPolicy,
  // "default": defaultPolicy
};

/**
 * Fallback por plataforma + source
 */
function resolveFallbackPolicy({ platform, source }) {
  if (platform === "woocommerce" && source === "ltm-mx") {
    return ltmPolicy;
  }

  return null;
}

/**
 * Default policy (no-op)
 */
function defaultPolicy({ input }) {
  return {
    ...input,
    _policy: {
      applied: "default",
      reason: "no_policy_match"
    }
  };
}

/**
 * Resolver principal
 */
function resolvePolicy({ policyKey, platform, source }) {
  // 1. Directo por policy_key
  if (policyKey && POLICY_REGISTRY[policyKey]) {
    return POLICY_REGISTRY[policyKey];
  }

  // 2. Fallback contextual
  const fallback = resolveFallbackPolicy({ platform, source });
  if (fallback) return fallback;

  // 3. Default
  return defaultPolicy;
}

/**
 * Ejecutar policy
 */
async function applyPolicy({
  input,
  policyKey,
  platform,
  source,
  store,
  context
}) {
  const policy = resolvePolicy({ policyKey, platform, source });

  return await policy({
    input,
    store,
    context
  });
}

module.exports = {
  resolvePolicy,
  applyPolicy
};
