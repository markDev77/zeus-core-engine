const fs = require("fs")
const path = require("path")

const STORE_FILE = path.join(__dirname, "../data/stores.json")

function loadStores() {

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify([]))
  }

  const raw = fs.readFileSync(STORE_FILE)

  try {

    const data = JSON.parse(raw)

    if (Array.isArray(data)) {
      return data
    }

    return Object.values(data)

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

function getStore(shop) {

  const stores = loadStores()

  return stores.find(
    s => s.shopDomain === shop
  )

}

function registerStore(shop, token, metadata = {}) {

  const stores = loadStores()

  let store = stores.find(
    s => s.shopDomain === shop
  )

  const profile = {
    country: metadata.country || "US",
    language: metadata.language || "en",
    currency: metadata.currency || "USD",
    marketplace: metadata.marketplace || "shopify"
  }

  if (!store) {

    store = {

      shopDomain: shop,
      accessToken: token,
      platform: metadata.platform || "shopify",

      createdAt: new Date().toISOString(),

      profile,

      billing: {
        plan: "free",
        status: "inactive",
        sku_limit: 50
      }

    }

    stores.push(store)

  } else {

    store.accessToken = token
    store.profile = profile

  }

  saveStores(stores)

  return store

}

function updateStorePlan(shop, planData) {

  const stores = loadStores()

  const store = stores.find(
    s => s.shopDomain === shop
  )

  if (!store) return null

  store.billing = {
    ...store.billing,
    ...planData
  }

  saveStores(stores)

  return store

}

module.exports = {

  registerStore,
  updateStorePlan,
  getStore,
  loadStores

}
