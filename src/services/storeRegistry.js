const { Pool } = require("pg");

const DEFAULT_REGION = "US";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_MARKETPLACE = "shopify";
const DEFAULT_PLATFORM = "shopify";

const storesByDomain = new Map();

let pool = null;
let initPromise = null;

function normalizeShopDomain(shopDomain) {
  if (!shopDomain || typeof shopDomain !== "string") {
    return null;
  }

  return shopDomain.trim().toLowerCase();
}

function createPool() {
  if (pool) {
    return pool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const isLocalDatabase =
    process.env.DATABASE_URL.includes("localhost") ||
    process.env.DATABASE_URL.includes("127.0.0.1");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalDatabase
      ? false
      : {
          rejectUnauthorized: false
        }
  });

  pool.on("error", (error) => {
    console.error("STORE REGISTRY POOL ERROR:", error.message);
  });

  return pool;
}

function buildProfile(metadata = {}) {
  const country =
    metadata.country ||
    metadata.region ||
    DEFAULT_REGION;

  return {
    country,
    region: country,
    language: metadata.language || DEFAULT_LANGUAGE,
    currency: metadata.currency || DEFAULT_CURRENCY,
    marketplace: metadata.marketplace || DEFAULT_MARKETPLACE,
    catalogOrigin: metadata.catalogOrigin || "global",
    translationMode: metadata.translationMode || "auto",
    marketSignalMode: metadata.marketSignalMode || "global",
    seoLocale: metadata.seoLocale || "en-US",
    titleStyle: metadata.titleStyle || "standard",
    descriptionStyle: metadata.descriptionStyle || "seo",
    tagStyle: metadata.tagStyle || "generic",
    categoryLocale: metadata.categoryLocale || "global"
  };
}

function buildBilling(existingBilling = {}, overrides = {}) {
  return {
    plan: "free",
    status: "active",
    sku_limit: 20,
    ...existingBilling,
    ...overrides
  };
}

function hydrateStoreFromRow(row) {
  if (!row) {
    return null;
  }

  const shopDomain = normalizeShopDomain(row.shop_domain);

  return {
    id: row.id,
    storeId: shopDomain,
    clientId: null,
    shopDomain,
    shop: shopDomain,
    storeDomain: shopDomain,
    accessToken: row.access_token,
    platform: DEFAULT_PLATFORM,
    createdAt: row.installed_at,
    installedAt: row.installed_at,
    profile: buildProfile({
      country: row.region,
      language: row.language
    }),
    billing: buildBilling()
  };
}

function toPersistedFields(store) {
  return {
    shopDomain: normalizeShopDomain(store.shopDomain || store.storeDomain || store.shop),
    accessToken: store.accessToken || null,
    region:
      store.profile?.country ||
      store.profile?.region ||
      DEFAULT_REGION,
    language:
      store.profile?.language ||
      DEFAULT_LANGUAGE,
    installedAt:
      store.installedAt ||
      store.createdAt ||
      new Date().toISOString()
  };
}

async function ensureTable() {
  const db = createPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id BIGSERIAL PRIMARY KEY,
      shop_domain TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      region TEXT NOT NULL,
      language TEXT NOT NULL,
      installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadStoresFromDatabase() {
  const db = createPool();

  const result = await db.query(`
    SELECT
      id,
      shop_domain,
      access_token,
      region,
      language,
      installed_at
    FROM stores
    ORDER BY id ASC
  `);

  storesByDomain.clear();

  for (const row of result.rows) {
    const store = hydrateStoreFromRow(row);

    if (store?.shopDomain) {
      storesByDomain.set(store.shopDomain, store);
    }
  }

  return listStores();
}

function initStoreRegistry() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureTable();
      await loadStoresFromDatabase();
      console.log("STORE REGISTRY READY:", storesByDomain.size);
      return true;
    })().catch((error) => {
      initPromise = null;
      console.error("STORE REGISTRY INIT ERROR:", error);
      throw error;
    });
  }

  return initPromise;
}

async function persistStore(store) {
  const db = createPool();
  const data = toPersistedFields(store);

  if (!data.shopDomain || !data.accessToken) {
    throw new Error("store persistence requires shopDomain and accessToken");
  }

  const result = await db.query(
    `
      INSERT INTO stores (
        shop_domain,
        access_token,
        region,
        language,
        installed_at
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (shop_domain)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        region = EXCLUDED.region,
        language = EXCLUDED.language
      RETURNING
        id,
        shop_domain,
        access_token,
        region,
        language,
        installed_at
    `,
    [
      data.shopDomain,
      data.accessToken,
      data.region,
      data.language,
      data.installedAt
    ]
  );

  const persistedStore = hydrateStoreFromRow(result.rows[0]);
  const cachedStore = storesByDomain.get(data.shopDomain);

  if (persistedStore && cachedStore) {
    persistedStore.billing = buildBilling(cachedStore.billing);
    persistedStore.clientId = cachedStore.clientId || null;
    storesByDomain.set(data.shopDomain, persistedStore);
  }

  return storesByDomain.get(data.shopDomain) || persistedStore;
}

function listStores() {
  return Array.from(storesByDomain.values());
}

function getStore(shopDomain) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);

  if (!normalizedShopDomain) {
    return null;
  }

  return storesByDomain.get(normalizedShopDomain) || null;
}

function getStoreById(storeId) {
  if (!storeId || typeof storeId !== "string") {
    return null;
  }

  const normalized = normalizeShopDomain(storeId);

  for (const store of storesByDomain.values()) {
    if (store.storeId === storeId || store.storeId === normalized) {
      return store;
    }

    if (store.shopDomain === normalized) {
      return store;
    }
  }

  return null;
}

function getStoreByApiCredentials(storeId, apiKey) {
  if (!storeId || !apiKey) {
    return null;
  }

  const store = getStoreById(storeId);

  if (!store) {
    return null;
  }

  if (store.apiKey && store.apiKey === apiKey) {
    return store;
  }

  return null;
}

function registerStore(shopDomain, accessToken, metadata = {}) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);

  if (!normalizedShopDomain) {
    throw new Error("Invalid shopDomain");
  }

  const existingStore = getStore(normalizedShopDomain);
  const profile = buildProfile(metadata);

  const store = {
    ...(existingStore || {}),
    storeId: metadata.storeId || normalizedShopDomain,
    clientId: metadata.clientId || existingStore?.clientId || null,
    shopDomain: normalizedShopDomain,
    shop: normalizedShopDomain,
    storeDomain: normalizedShopDomain,
    accessToken,
    platform: metadata.platform || existingStore?.platform || DEFAULT_PLATFORM,
    createdAt:
      existingStore?.createdAt ||
      new Date().toISOString(),
    installedAt:
      existingStore?.installedAt ||
      new Date().toISOString(),
    profile,
    billing: buildBilling(existingStore?.billing)
  };

  storesByDomain.set(normalizedShopDomain, store);

  persistStore(store).catch((error) => {
    console.error("STORE REGISTRY PERSIST ERROR:", error.message);
  });

  console.log("STORE REGISTERED:", normalizedShopDomain);

  return store;
}

function updateStorePlan(shopDomain, planData = {}) {
  const store = getStore(shopDomain);

  if (!store) {
    return null;
  }

  store.billing = buildBilling(store.billing, planData);
  storesByDomain.set(store.shopDomain, store);

  return store;
}

module.exports = {
  initStoreRegistry,
  registerStore,
  updateStorePlan,
  getStore,
  getStoreById,
  getStoreByApiCredentials,
  listStores
};
