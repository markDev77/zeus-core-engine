const fs = require("fs")
const path = require("path")

const STORE_FILE = path.join(__dirname, "../data/stores.json")

function loadStores() {

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify([], null, 2))
  }

  const raw = fs.readFileSync(STORE_FILE)

  try {

    const data = JSON.parse(raw)

    if (Array.isArray(data)) return data

    return []

  } catch {

    return []

  }

}

function saveStores(stores) {

  fs.writeFileSync(
    STORE_FILE,
    JSON.stringify(stores, null, 2)
  )

}

function applyProfileOverrides(shopDomain, profile = {}) {

  if (shopDomain === "eawi7g-hj.myshopify.com") {

    return {
      ...profile,
      country: "MX",
      language: "es",
      currency: "MXN"
    }

  }

  return profile

}

function getStore(shopDomain) {

  const stores = loadStores()

  const store = stores.find(
    s => s.shopDomain === shopDomain
  )

  if (!store) return null

  return {
    ...store,
    profile: applyProfileOverrides(
      shopDomain,
      store.profile || {}
    )
  }

}

function registerStore(shopDomain, accessToken, metadata = {}) {

  const stores = loadStores()

  let store = stores.find(
    s => s.shopDomain === shopDomain
  )

  const profile = applyProfileOverrides(
    shopDomain,
    {
      country: metadata.country || "US",
      language: metadata.language || "en-US",
      currency: metadata.currency || "USD",
      marketplace: metadata.marketplace || "shopify"
    }
  )

  if (!store) {

    store = {

      storeId: shopDomain,

      shopDomain,
      accessToken,

      platform: metadata.platform || "shopify",

      createdAt: new Date().toISOString(),

      profile,

      billing: {
        plan: "free",
        status: "active",
        sku_limit: 20
      }

    }

    stores.push(store)

  } else {

    store.accessToken = accessToken
    store.profile = profile

  }

  saveStores(stores)

  console.log("STORE REGISTERED:", shopDomain)

  return store

}

function updateStorePlan(shopDomain, planData) {

  const stores = loadStores()

  const store = stores.find(
    s => s.shopDomain === shopDomain
  )

  if (!store) return null

  store.billing = {
    ...store.billing,
    ...planData
  }

  saveStores(stores)

  return {
    ...store,
    profile: applyProfileOverrides(
      shopDomain,
      store.profile || {}
    )
  }

}

module.exports = {

  registerStore,
  updateStorePlan,
  getStore,
  loadStores

}
