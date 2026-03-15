/*
========================================
ZEUS STORE REGISTRY
========================================
Guarda las tiendas conectadas y su perfil
Persistencia JSON local
========================================
*/

const fs = require("fs");
const path = require("path");

const STORE_FILE = path.join(__dirname, "../storage/stores.json");

function loadStores() {

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify([]));
  }

  const raw = fs.readFileSync(STORE_FILE);
  return JSON.parse(raw);

}

function saveStores(stores) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(stores, null, 2));
}

function buildStoreId(input = {}) {

  if (input.storeId) return String(input.storeId).trim();

  if (input.shop) return String(input.shop).trim().toLowerCase();

  if (input.storeDomain) return String(input.storeDomain).trim().toLowerCase();

  return `store_${Date.now()}`;

}

function generateApiKey(prefix = "zeus_live") {

  const random = Math.random().toString(36).slice(2);
  const timestamp = Date.now().toString(36);

  return `${prefix}_${timestamp}${random}`;

}

function registerStore(shop, token, options = {}) {

  const stores = loadStores();

  const normalizedShop = shop ? String(shop).trim().toLowerCase() : null;

  const existingStore = normalizedShop
    ? stores.find(s => s.shop === normalizedShop)
    : null;

  const newStoreData = {

    storeId: buildStoreId({
      storeId: options.storeId,
      shop: normalizedShop,
      storeDomain: options.storeDomain
    }),

    clientId: options.clientId || null,

    platform: options.platform || "shopify",

    shop: normalizedShop,

    storeDomain: options.storeDomain || normalizedShop,

    token,

    apiKey: options.apiKey || (existingStore ? existingStore.apiKey : generateApiKey()),

    status: options.status || "active",

    profile: {

      country: options.country || "US",

      language: options.language || "en-US",

      currency: options.currency || "USD",

      marketplace: options.marketplace || "shopify",

      catalogOrigin: options.catalogOrigin || "external",

      translationMode: options.translationMode || "auto",

      marketSignalMode: options.marketSignalMode || "enabled",

      seoLocale: options.seoLocale || (options.language || "en-US"),

      titleStyle: options.titleStyle || "generic",

      descriptionStyle: options.descriptionStyle || "generic",

      tagStyle: options.tagStyle || "generic",

      categoryLocale: options.categoryLocale || "en"

    },

    billing: existingStore?.billing || {
      plan: "free",
      sku_limit: 50,
      status: "inactive",
      updatedAt: new Date().toISOString()
    },

    createdAt: existingStore ? existingStore.createdAt : new Date().toISOString(),

    updatedAt: new Date().toISOString()

  };

  if (existingStore) {

    Object.assign(existingStore, newStoreData);

    saveStores(stores);

    console.log("STORE UPDATED:", existingStore.storeId);

    return existingStore;

  }

  stores.push(newStoreData);

  saveStores(stores);

  console.log("STORE REGISTERED:", newStoreData.storeId);

  return newStoreData;

}

function updateStorePlan(shop, planData = {}) {

  const stores = loadStores();

  const normalizedShop = String(shop).trim().toLowerCase();

  const store = stores.find(
    s => s.shop === normalizedShop || s.storeDomain === normalizedShop
  );

  if (!store) {

    console.error("STORE NOT FOUND FOR PLAN UPDATE:", shop);

    return null;

  }

  store.billing = {
    ...(store.billing || {}),
    ...planData,
    updatedAt: new Date().toISOString()
  };

  saveStores(stores);

  console.log("STORE PLAN UPDATED:", shop, planData.plan);

  return store;

}

function getStore(shop) {

  const stores = loadStores();

  if (!shop) return null;

  const normalizedShop = String(shop).trim().toLowerCase();

  return stores.find(
    s => s.shop === normalizedShop || s.storeDomain === normalizedShop
  ) || null;

}

function getStoreById(storeId) {

  const stores = loadStores();

  if (!storeId) return null;

  return stores.find(s => s.storeId === String(storeId).trim()) || null;

}

function getStoreByApiCredentials(storeId, apiKey) {

  const stores = loadStores();

  if (!apiKey) return null;

  const normalizedStoreId = storeId ? String(storeId).trim() : null;

  const normalizedApiKey = String(apiKey).trim();

  return stores.find(s => {

    const sameApiKey = s.apiKey === normalizedApiKey;

    const sameStoreId = normalizedStoreId ? s.storeId === normalizedStoreId : true;

    return sameApiKey && sameStoreId;

  }) || null;

}

function getAllStores() {
  return loadStores();
}

module.exports = {

  registerStore,
  updateStorePlan,
  getStore,
  getStoreById,
  getStoreByApiCredentials,
  getAllStores

};
