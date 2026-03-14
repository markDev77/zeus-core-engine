/*
========================================
ZEUS STORE REGISTRY
========================================
Guarda las tiendas conectadas y su perfil regional
*/

const stores = [];

function buildStoreId(input = {}) {
  if (input.storeId) {
    return String(input.storeId).trim();
  }

  if (input.shop) {
    return String(input.shop).trim().toLowerCase();
  }

  if (input.storeDomain) {
    return String(input.storeDomain).trim().toLowerCase();
  }

  return `store_${Date.now()}`;
}

function generateApiKey(prefix = "zeus_live") {
  const random = Math.random().toString(36).slice(2);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}${random}`;
}

function registerStore(shop, token, options = {}) {
  const normalizedShop = shop ? String(shop).trim().toLowerCase() : null;

  const existingStore = normalizedShop
    ? stores.find(s => s.shop === normalizedShop || s.storeDomain === normalizedShop)
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
    createdAt: existingStore ? existingStore.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingStore) {
    Object.assign(existingStore, newStoreData);
    console.log("STORE UPDATED:", existingStore.storeId);
    return existingStore;
  }

  stores.push(newStoreData);

  console.log("STORE REGISTERED:", newStoreData.storeId);

  return newStoreData;
}

function registerApiClient(storeData = {}) {
  const existingStore = storeData.storeId
    ? stores.find(s => s.storeId === storeData.storeId)
    : null;

  const finalStore = {
    storeId: buildStoreId(storeData),
    clientId: storeData.clientId || null,
    platform: storeData.platform || "custom",
    shop: storeData.shop || null,
    storeDomain: storeData.storeDomain || null,
    token: storeData.token || null,
    apiKey: storeData.apiKey || (existingStore ? existingStore.apiKey : generateApiKey()),
    status: storeData.status || "active",
    profile: {
      country: storeData.country || "US",
      language: storeData.language || "en-US",
      currency: storeData.currency || "USD",
      marketplace: storeData.marketplace || storeData.platform || "custom",
      catalogOrigin: storeData.catalogOrigin || "external",
      translationMode: storeData.translationMode || "auto",
      marketSignalMode: storeData.marketSignalMode || "enabled",
      seoLocale: storeData.seoLocale || (storeData.language || "en-US"),
      titleStyle: storeData.titleStyle || "generic",
      descriptionStyle: storeData.descriptionStyle || "generic",
      tagStyle: storeData.tagStyle || "generic",
      categoryLocale: storeData.categoryLocale || "en"
    },
    createdAt: existingStore ? existingStore.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingStore) {
    Object.assign(existingStore, finalStore);
    return existingStore;
  }

  stores.push(finalStore);
  return finalStore;
}

function updateStoreProfile(storeId, profile = {}) {
  const store = stores.find(s => s.storeId === storeId);

  if (!store) {
    return null;
  }

  store.profile = {
    ...store.profile,
    ...profile
  };

  store.updatedAt = new Date().toISOString();

  return store;
}

function getStore(shop) {
  if (!shop) {
    return null;
  }

  const normalizedShop = String(shop).trim().toLowerCase();

  return stores.find(
    s => s.shop === normalizedShop || s.storeDomain === normalizedShop
  ) || null;
}

function getStoreById(storeId) {
  if (!storeId) {
    return null;
  }

  return stores.find(s => s.storeId === String(storeId).trim()) || null;
}

function getStoreByApiCredentials(storeId, apiKey) {
  if (!apiKey) {
    return null;
  }

  const normalizedStoreId = storeId ? String(storeId).trim() : null;
  const normalizedApiKey = String(apiKey).trim();

  return (
    stores.find(s => {
      const sameApiKey = s.apiKey === normalizedApiKey;
      const sameStoreId = normalizedStoreId ? s.storeId === normalizedStoreId : true;
      return sameApiKey && sameStoreId;
    }) || null
  );
}

function getAllStores() {
  return stores;
}

module.exports = {
  registerStore,
  registerApiClient,
  updateStoreProfile,
  getStore,
  getStoreById,
  getStoreByApiCredentials,
  getAllStores
};
