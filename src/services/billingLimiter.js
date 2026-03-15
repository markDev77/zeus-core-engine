const storeRegistry = require("./storeRegistry")
const productRegistry = require("./productRegistry")

function checkBillingAccess(shop) {

  const store = storeRegistry.getStore(shop)

  if (!store) {

    return {
      allowed: false,
      reason: "store_not_registered"
    }

  }

  const billing = store.billing || {}

  if (billing.status !== "active") {

    return {
      allowed: false,
      reason: "plan_not_active"
    }

  }

  const limit = billing.sku_limit || 0

  const products = productRegistry.getAllProducts()

  const processed = Object.values(products || {})
    .filter(p => p.store === shop)
    .length

  if (processed >= limit) {

    return {
      allowed: false,
      reason: "sku_limit_reached",
      limit
    }

  }

  return {
    allowed: true,
    limit,
    processed
  }

}

module.exports = {
  checkBillingAccess
}
