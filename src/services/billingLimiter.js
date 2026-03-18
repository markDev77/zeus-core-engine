const storeRegistry = require("./storeRegistry")
const productRegistry = require("./productRegistry")

/*
====================================================
PLAN CONFIG
====================================================
*/

const PLAN_CONFIG = {
  free: { sku_limit: 20 },
  starter: { sku_limit: 300 },
  growth: { sku_limit: 1000 },
  scale: { sku_limit: 3000 },
  powerful: { sku_limit: 50000 }
}

function getPlanConfig(plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG["free"]
}

/*
====================================================
MAIN CHECK
====================================================
*/

function checkBillingAccess(shop) {

  const store = storeRegistry.getStore(shop)

  if (!store) {
    return {
      allowed: false,
      reason: "store_not_registered"
    }
  }

  const billing = store.billing || {}

  /*
  ============================================
  FIX 1: billing_status correcto
  ============================================
  */

  if (billing.status !== "active") {
  return {
    allowed: false,
    reason: "plan_not_active"
  }
}

  /*
  ============================================
  LIMIT
  ============================================
  */

  const limit =
    billing.sku_limit ||
    getPlanConfig(billing.plan).sku_limit ||
    0

  /*
  ============================================
  FIX 2: CONTADOR REAL POR STORE
  ============================================
  */

  const products = productRegistry.getAllProducts()

  const processed = Object.values(products || {})
    .filter(p => {

      // soporta múltiples estructuras
      return (
        p.store === shop ||
        p.store?.shopDomain === shop ||
        p.storeDomain === shop
      )

    })
    .length

  /*
  ============================================
  BLOCK
  ============================================
  */

  if (processed >= limit) {

    console.log("🚫 SKU LIMIT REACHED:", shop, processed, "/", limit)

    return {
      allowed: false,
      reason: "sku_limit_reached",
      limit,
      processed
    }
  }

  /*
  ============================================
  OK
  ============================================
  */

  return {
    allowed: true,
    limit,
    processed
  }
}

module.exports = {
  checkBillingAccess,
  PLAN_CONFIG,
  getPlanConfig
}
