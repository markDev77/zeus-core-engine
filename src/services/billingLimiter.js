const storeRegistry = require("./storeRegistry");

function getStoreBilling(shop) {
  const store = storeRegistry.getStore(shop);
  if (!store || !store.billing) return null;
  return store.billing;
}

function isPlanActive(shop) {
  const billing = getStoreBilling(shop);
  if (!billing) return false;
  return billing.status === "active";
}

function checkPlanLimit(shop, currentProcessedCount) {
  const billing = getStoreBilling(shop);

  if (!billing) {
    return {
      allowed: false,
      reason: "store_not_found"
    };
  }

  if (billing.status !== "active") {
    return {
      allowed: false,
      reason: "plan_not_active"
    };
  }

  const limit = billing.sku_limit || 0;

  if (currentProcessedCount >= limit) {
    return {
      allowed: false,
      reason: "sku_limit_reached",
      limit
    };
  }

  return {
    allowed: true,
    limit
  };
}

module.exports = {
  checkPlanLimit,
  isPlanActive,
  getStoreBilling
};
