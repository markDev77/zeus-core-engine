const { Pool } = require("pg");

const DEFAULT_REGION = "US";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_MARKETPLACE = "shopify";
const DEFAULT_PLATFORM = "shopify";
const DEFAULT_PLAN = "free";
const DEFAULT_BILLING_STATUS = "active";
const DEFAULT_SKU_LIMIT = 20;

const storesByDomain = new Map();

let pool = null;
let initPromise = null;

function normalizeShopDomain(shopDomain) {
  if (!shopDomain || typeof shopDomain !== "string") {
    return null;
  }

  return shopDomain.trim().toLowerCase();
}

function getCurrentPeriodKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
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
    plan: DEFAULT_PLAN,
    status: DEFAULT_BILLING_STATUS,
    sku_limit: DEFAULT_SKU_LIMIT,
    stripe_customer: null,
    stripe_subscription: null,
    activatedAt: null,
    currentPeriodKey: getCurrentPeriodKey(),
    currentPeriodUsage: 0,
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
    platform: row.platform || DEFAULT_PLATFORM,
    createdAt: row.installed_at,
    installedAt: row.installed_at,
    profile: buildProfile({
      country: row.region,
      language: row.language,
      currency: row.currency,
      marketplace: row.marketplace
    }),
    billing: buildBilling(
      {},
      {
        plan: row.plan || DEFAULT_PLAN,
        status: row.billing_status || DEFAULT_BILLING_STATUS,
        sku_limit:
          Number.isFinite(Number(row.sku_limit))
            ? Number(row.sku_limit)
            : DEFAULT_SKU_LIMIT,
        stripe_customer: row.stripe_customer || null,
        stripe_subscription: row.stripe_subscription || null,
        activatedAt: row.activated_at || null,
        currentPeriodKey: getCurrentPeriodKey(),
        currentPeriodUsage:
          Number.isFinite(Number(row.current_period_usage))
            ? Number(row.current_period_usage)
            : 0
      }
    )
  };
}

function toPersistedFields(store) {
  const billing = buildBilling(store.billing);

  return {
    shopDomain: normalizeShopDomain(
      store.shopDomain || store.storeDomain || store.shop
    ),
    accessToken: store.accessToken || null,
    platform: store.platform || DEFAULT_PLATFORM,
    region:
      store.profile?.country ||
      store.profile?.region ||
      DEFAULT_REGION,
    language:
      store.profile?.language ||
      DEFAULT_LANGUAGE,
    currency:
      store.profile?.currency ||
      DEFAULT_CURRENCY,
    marketplace:
      store.profile?.marketplace ||
      DEFAULT_MARKETPLACE,
    installedAt:
      store.installedAt ||
      store.createdAt ||
      new Date().toISOString(),
    plan: billing.plan || DEFAULT_PLAN,
    billingStatus: billing.status || DEFAULT_BILLING_STATUS,
    skuLimit:
      Number.isFinite(Number(billing.sku_limit))
        ? Number(billing.sku_limit)
        : DEFAULT_SKU_LIMIT,
    stripeCustomer: billing.stripe_customer || null,
    stripeSubscription: billing.stripe_subscription || null,
    activatedAt: billing.activatedAt || null
  };
}

async function ensureTables() {
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

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT '${DEFAULT_PLATFORM}'
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT '${DEFAULT_CURRENCY}'
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS marketplace TEXT NOT NULL DEFAULT '${DEFAULT_MARKETPLACE}'
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT '${DEFAULT_PLAN}'
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT '${DEFAULT_BILLING_STATUS}'
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS sku_limit INTEGER NOT NULL DEFAULT ${DEFAULT_SKU_LIMIT}
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS stripe_customer TEXT
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS stripe_subscription TEXT
  `);

  await db.query(`
    ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS store_usage (
      id BIGSERIAL PRIMARY KEY,
      shop_domain TEXT NOT NULL,
      period_key TEXT NOT NULL,
      optimized_count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (shop_domain, period_key)
    )
  `);
}

async function loadStoresFromDatabase() {
  const db = createPool();
  const currentPeriodKey = getCurrentPeriodKey();

  const result = await db.query(
    `
      SELECT
        s.id,
        s.shop_domain,
        s.access_token,
        s.platform,
        s.region,
        s.language,
        s.currency,
        s.marketplace,
        s.installed_at,
        s.plan,
        s.billing_status,
        s.sku_limit,
        s.stripe_customer,
        s.stripe_subscription,
        s.activated_at,
        COALESCE(u.optimized_count, 0) AS current_period_usage
      FROM stores s
      LEFT JOIN store_usage u
        ON u.shop_domain = s.shop_domain
       AND u.period_key = $1
      ORDER BY s.id ASC
    `,
    [currentPeriodKey]
  );

  storesByDomain.clear();

  for (const row of result.rows) {
    const store = hydrateStoreFromRow(row);

    if (store?.shopDomain) {
      storesByDomain.set(store.shopDomain, store);
    }
  }

  return listStores();
}

async function fetchStoreFromDatabase(shopDomain) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);

  if (!normalizedShopDomain) {
    return null;
  }

  const db = createPool();
  const currentPeriodKey = getCurrentPeriodKey();

  const result = await db.query(
    `
      SELECT
        s.id,
        s.shop_domain,
        s.access_token,
        s.platform,
        s.region,
        s.language,
        s.currency,
        s.marketplace,
        s.installed_at,
        s.plan,
        s.billing_status,
        s.sku_limit,
        s.stripe_customer,
        s.stripe_subscription,
        s.activated_at,
        COALESCE(u.optimized_count, 0) AS current_period_usage
      FROM stores s
      LEFT JOIN store_usage u
        ON u.shop_domain = s.shop_domain
       AND u.period_key = $2
      WHERE s.shop_domain = $1
      LIMIT 1
    `,
    [normalizedShopDomain, currentPeriodKey]
  );

  const store = hydrateStoreFromRow(result.rows?.[0] || null);

  if (store?.shopDomain) {
    const existingStore = storesByDomain.get(store.shopDomain);

    if (existingStore?.clientId && !store.clientId) {
      store.clientId = existingStore.clientId;
    }

    if (existingStore?.apiKey && !store.apiKey) {
      store.apiKey = existingStore.apiKey;
    }

    storesByDomain.set(store.shopDomain, {
      ...(existingStore || {}),
      ...store,
      billing: buildBilling(
        existingStore?.billing,
        store.billing
      )
    });
  }

  return store;
}

async function refreshStore(shopDomain) {
  return fetchStoreFromDatabase(shopDomain);
}

async function refreshAllStores() {
  return loadStoresFromDatabase();
}

function initStoreRegistry() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureTables();
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
        platform,
        region,
        language,
        currency,
        marketplace,
        installed_at,
        plan,
        billing_status,
        sku_limit,
        stripe_customer,
        stripe_subscription,
        activated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (shop_domain)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        platform = EXCLUDED.platform,
        region = EXCLUDED.region,
        language = EXCLUDED.language,
        currency = EXCLUDED.currency,
        marketplace = EXCLUDED.marketplace,
        plan = EXCLUDED.plan,
        billing_status = EXCLUDED.billing_status,
        sku_limit = EXCLUDED.sku_limit,
        stripe_customer = EXCLUDED.stripe_customer,
        stripe_subscription = EXCLUDED.stripe_subscription,
        activated_at = EXCLUDED.activated_at
      RETURNING
        id,
        shop_domain,
        access_token,
        platform,
        region,
        language,
        currency,
        marketplace,
        installed_at,
        plan,
        billing_status,
        sku_limit,
        stripe_customer,
        stripe_subscription,
        activated_at
    `,
    [
      data.shopDomain,
      data.accessToken,
      data.platform,
      data.region,
      data.language,
      data.currency,
      data.marketplace,
      data.installedAt,
      data.plan,
      data.billingStatus,
      data.skuLimit,
      data.stripeCustomer,
      data.stripeSubscription,
      data.activatedAt
    ]
  );

  const cachedStore = storesByDomain.get(data.shopDomain);
  const persistedStore = hydrateStoreFromRow({
    ...result.rows[0],
    current_period_usage:
      cachedStore?.billing?.currentPeriodUsage || 0
  });

  if (persistedStore) {
    persistedStore.clientId = cachedStore?.clientId || null;

    if (cachedStore?.apiKey) {
      persistedStore.apiKey = cachedStore.apiKey;
    }

    storesByDomain.set(data.shopDomain, {
      ...(cachedStore || {}),
      ...persistedStore,
      billing: buildBilling(
        cachedStore?.billing,
        persistedStore.billing
      )
    });
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

async function getStoreFresh(shopDomain) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);

  if (!normalizedShopDomain) {
    return null;
  }

  const freshStore = await fetchStoreFromDatabase(normalizedShopDomain);

  if (freshStore) {
    return storesByDomain.get(normalizedShopDomain) || freshStore;
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

async function registerStore(shopDomain, accessToken, metadata = {}) {
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
    billing: buildBilling(
      existingStore?.billing,
      metadata.billing || {}
    )
  };

  storesByDomain.set(normalizedShopDomain, store);

  // 🔥 FIX REAL
  await persistStore(store);

  console.log("🔥 STORE REGISTERED (DB OK):", normalizedShopDomain);

  return store;
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
    billing: buildBilling(
      existingStore?.billing,
      metadata.billing || {}
    )
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

  const mergedBilling = buildBilling(store.billing, planData);

  if (
    mergedBilling.status === "active" &&
    !mergedBilling.activatedAt
  ) {
    mergedBilling.activatedAt = new Date().toISOString();
  }

  store.billing = mergedBilling;
  storesByDomain.set(store.shopDomain, store);

  persistStore(store).catch((error) => {
    console.error("STORE REGISTRY BILLING PERSIST ERROR:", error.message);
  });

  return store;
}

async function incrementStoreUsage(shopDomain, count = 1) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);

  if (!normalizedShopDomain) {
    throw new Error("Invalid shopDomain");
  }

  const incrementBy = Number.isFinite(Number(count))
    ? Number(count)
    : 1;

  const db = createPool();
  const periodKey = getCurrentPeriodKey();

  const result = await db.query(
    `
      INSERT INTO store_usage (
        shop_domain,
        period_key,
        optimized_count,
        updated_at
      )
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (shop_domain, period_key)
      DO UPDATE SET
        optimized_count = store_usage.optimized_count + EXCLUDED.optimized_count,
        updated_at = NOW()
      RETURNING
        optimized_count
    `,
    [normalizedShopDomain, periodKey, incrementBy]
  );

  const usage =
    Number(result.rows?.[0]?.optimized_count || 0);

  const store = getStore(normalizedShopDomain);

  if (store) {
    store.billing = buildBilling(store.billing, {
      currentPeriodKey: periodKey,
      currentPeriodUsage: usage
    });

    storesByDomain.set(normalizedShopDomain, store);
  }

  return usage;
}

function getStoreUsage(shopDomain) {
  const store = getStore(shopDomain);

  if (!store) {
    return null;
  }

  return {
    currentPeriodKey:
      store.billing?.currentPeriodKey || getCurrentPeriodKey(),
    currentPeriodUsage:
      Number(store.billing?.currentPeriodUsage || 0)
  };
}

async function getStoreUsageFresh(shopDomain) {
  const store = await getStoreFresh(shopDomain);

  if (!store) {
    return null;
  }

  return {
    currentPeriodKey:
      store.billing?.currentPeriodKey || getCurrentPeriodKey(),
    currentPeriodUsage:
      Number(store.billing?.currentPeriodUsage || 0)
  };
}

module.exports = {
  initStoreRegistry,
  registerStore,
  updateStorePlan,
  getStore,
  getStoreFresh,
  refreshStore,
  refreshAllStores,
  getStoreById,
  getStoreByApiCredentials,
  listStores,
  incrementStoreUsage,
  getStoreUsage,
  getStoreUsageFresh
};
