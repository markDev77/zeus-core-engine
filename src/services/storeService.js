const pool = require("../db");

/*
========================================
VALIDACIÓN
========================================
*/

const REQUIRED = [
  "shop",
  "access_token",
  "platform",
  "status",
  "region",
  "language",
  "currency",
  "marketplace",
  "plan",
  "billing_status",
  "sku_limit",
  "tokens"
];

function validateStore(store) {
  for (const f of REQUIRED) {
    if (store[f] === null || store[f] === undefined) {
      throw new Error(`STORE INVALID: missing ${f}`);
    }
  }

  if (store.status !== "active") {
    throw new Error("STORE NOT ACTIVE");
  }
}

/*
========================================
GET STORE
========================================
*/

async function getStore(shop) {
  const { rows } = await pool.query(
    "SELECT * FROM stores WHERE shop = $1",
    [shop]
  );

  if (!rows.length) {
    throw new Error("STORE NOT REGISTERED");
  }

  const store = rows[0];
  validateStore(store);
  return store;
}

/*
========================================
UPSERT STORE (FIXED)
========================================
*/

async function upsertStore(data) {
  const {
    shop,
    access_token,
    region = "mx",
    language = "es",
    currency = "USD",
    marketplace = "zeus",
    plan = "free",
    billing_status = "active",
    sku_limit = 100,
    tokens = 5
  } = data;

  const status = data.status || "active";

  const { rows } = await pool.query(
    `
    INSERT INTO stores (
      shop,
      access_token,
      platform,
      status,
      region,
      language,
      currency,
      marketplace,
      plan,
      billing_status,
      sku_limit,
      tokens,
      activated_at
    )
    VALUES (
      $1,$2,'shopify',$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()
    )
    ON CONFLICT (shop)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      status = EXCLUDED.status,
      plan = EXCLUDED.plan,
      billing_status = EXCLUDED.billing_status,
      tokens = EXCLUDED.tokens
    RETURNING *;
    `,
    [
      shop,
      access_token,
      status,
      region,
      language,
      currency,
      marketplace,
      plan,
      billing_status,
      sku_limit,
      tokens
    ]
  );

  return rows[0];
}

/*
========================================
TOKEN ENGINE
========================================
*/

async function consumeToken(shop) {
  const { rowCount } = await pool.query(
    `
    UPDATE stores
    SET 
      tokens = tokens - 1,
      tokens_used = tokens_used + 1,
      updated_at = NOW()
    WHERE shop = $1
      AND tokens > 0
    `,
    [shop]
  );

  if (rowCount === 0) {
    throw new Error("NO TOKENS AVAILABLE");
  }

  return true;
}

async function getTokenBalance(shop) {
  const { rows } = await pool.query(
    `
    SELECT tokens, tokens_used
    FROM stores
    WHERE shop = $1
    `,
    [shop]
  );

  if (!rows.length) {
    throw new Error("STORE NOT FOUND");
  }

  return rows[0];
}

module.exports = {
  getStore,
  upsertStore,
  consumeToken,
  getTokenBalance
};
