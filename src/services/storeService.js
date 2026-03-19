const pool = require("../db"); // ajusta a tu conexión real

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
      $1,$2,'shopify','active',$3,$4,$5,$6,$7,$8,$9,$10,NOW()
    )
    ON CONFLICT (shop)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      status = 'active',
      plan = EXCLUDED.plan,
      billing_status = EXCLUDED.billing_status,
      tokens = EXCLUDED.tokens
    RETURNING *;
  `,
    [
      shop,
      access_token,
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

module.exports = {
  getStore,
  upsertStore
};
