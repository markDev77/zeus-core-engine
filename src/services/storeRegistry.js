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
    s => s.shop === shop
  )

}

function registerStore(shop, token) {

  const stores = loadStores()

  let store = stores.find(
    s => s.shop === shop
  )

  if (!store) {

    store = {
      shop,
      token,
      createdAt: new Date().toISOString(),
      billing: {
        plan: "free",
        status: "inactive",
        sku_limit: 50
      }
    }

    stores.push(store)

  } else {

    store.token = token

  }

  saveStores(stores)

  return store

}

function updateStorePlan(shop, planData) {

  const stores = loadStores()

  const store = stores.find(
    s => s.shop === shop
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
