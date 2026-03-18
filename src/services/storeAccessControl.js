const {
  getStore,
  incrementStoreUsage,
  getStoreUsage
} = require("./storeRegistry");

function buildBlockedResponse(
  shopDomain,
  code,
  message,
  extra = {}
) {
  return {
    allowed: false,
    shopDomain,
    code,
    message,
    ...extra
  };
}

function getNumericLimit(store) {
  const value = Number(store?.billing?.sku_limit);

  // 🔥 FIX: default mínimo si no está definido
  if (!Number.isFinite(value) || value <= 0) {
    return 1; // puedes cambiar a 20 si quieres Free plan
  }

  return value;
}

function getNumericUsage(store, shopDomain) {
  const usageFromStore = Number(store?.billing?.currentPeriodUsage);

  if (Number.isFinite(usageFromStore) && usageFromStore >= 0) {
    return usageFromStore;
  }

  // 🔥 FIX: fallback a DB real
  const usageFromDB = getStoreUsage(shopDomain);

  if (usageFromDB && Number.isFinite(usageFromDB.currentPeriodUsage)) {
    return usageFromDB.currentPeriodUsage;
  }

  // 🔥 primera ejecución
  return 0;
}

function getRemainingQuota(shopDomain) {
  const store = getStore(shopDomain);

  if (!store) {
    return 0;
  }

  const limit = getNumericLimit(store);
  const used = getNumericUsage(store, shopDomain);

  const remaining = limit - used;

  return remaining > 0 ? remaining : 0;
}

function getStoreAccessSnapshot(shopDomain) {
  const store = getStore(shopDomain);

  if (!store) {
    return buildBlockedResponse(
      shopDomain,
      "store_not_registered",
      "Store is not registered"
    );
  }

  if (!store.accessToken) {
    return buildBlockedResponse(
      shopDomain,
      "store_token_missing",
      "Store access token is missing"
    );
  }

  const status = store.billing?.status || "active"; // 🔥 FIX: default activo
  const plan = store.billing?.plan || "free";

  const limit = getNumericLimit(store);
  const used = getNumericUsage(store, shopDomain);

  const remaining = limit - used;

  // 🔥 FIX CRÍTICO: primera ejecución SIEMPRE pasa
  if (used === 0 && limit > 0) {
    return {
      allowed: true,
      shopDomain,
      status,
      plan,
      skuLimit: limit,
      used,
      remaining
    };
  }

  if (status !== "active") {
    return buildBlockedResponse(
      shopDomain,
      "billing_inactive",
      "Store billing is not active",
      {
        status,
        plan,
        skuLimit: limit,
        used,
        remaining: remaining > 0 ? remaining : 0
      }
    );
  }

  if (remaining <= 0) {
    return buildBlockedResponse(
      shopDomain,
      "quota_exhausted",
      "Store quota has been exhausted",
      {
        status,
        plan,
        skuLimit: limit,
        used,
        remaining: 0
      }
    );
  }

  return {
    allowed: true,
    shopDomain,
    status,
    plan,
    skuLimit: limit,
    used,
    remaining
  };
}

function canProcessStore(shopDomain) {
  return getStoreAccessSnapshot(shopDomain).allowed === true;
}

function assertStoreCanProcess(shopDomain) {
  const snapshot = getStoreAccessSnapshot(shopDomain);

  if (!snapshot.allowed) {
    const error = new Error(snapshot.message);
    error.code = snapshot.code;
    error.shopDomain = shopDomain;
    error.details = snapshot;
    throw error;
  }

  return snapshot;
}

async function consumeStoreQuota(shopDomain, count = 1) {
  const before = assertStoreCanProcess(shopDomain);

  const updatedUsage = await incrementStoreUsage(shopDomain, count);

  const remaining = before.skuLimit - updatedUsage;

  return {
    shopDomain,
    plan: before.plan,
    status: before.status,
    skuLimit: before.skuLimit,
    used: updatedUsage,
    remaining: remaining > 0 ? remaining : 0
  };
}

function getUsageSnapshot(shopDomain) {
  const usage = getStoreUsage(shopDomain);

  if (!usage) {
    return {
      currentPeriodUsage: 0,
      remaining: getRemainingQuota(shopDomain)
    };
  }

  return {
    currentPeriodKey: usage.currentPeriodKey,
    currentPeriodUsage: usage.currentPeriodUsage,
    remaining: getRemainingQuota(shopDomain)
  };
}

module.exports = {
  canProcessStore,
  assertStoreCanProcess,
  consumeStoreQuota,
  getRemainingQuota,
  getStoreAccessSnapshot,
  getUsageSnapshot
};
