if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cheerio = require("cheerio");

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  OPENAI_API_KEY
} = process.env;

const express = require("express");
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE KEY NOT LOADED");
} else {
  console.log("✅ STRIPE KEY LOADED");
}

const { Pool } = require("pg");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

/* 🔥 BODY PARSER CORRECTO (UNA SOLA VEZ) */
app.use(express.json({
  limit: "10mb",
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

/* 🔥 CORS */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

/* 🔥 EMBED SHOPIFY */
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");

  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com https://admin.shopify.com/store/*;"
  );

  next();
});

/* ROOT */
app.get("/", (req, res) => {
  res.send("ZEUS EMBED READY");
});

/* DEBUG STRIPE */
console.log("STRIPE KEY:", process.env.STRIPE_SECRET_KEY?.slice(0, 10));

/* 🔥 CHECKOUT */
app.post('/stripe/create-checkout', async (req, res) => {
  try {

    console.log("👉 RAW BODY:", req.body);

    const shop = req.body && req.body.shop;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop' });
    }

    console.log("👉 SHOP:", shop);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'ZEUS Tokens - 300',
            description: '300 product optimizations'
          },
          unit_amount: 4900
        },
        quantity: 1
      }],

      metadata: {
        shop: shop,
        tokens: 300
      },

      success_url: `https://zeusinfra.io/activation?shop=${shop}&success=true`,
      cancel_url: `https://zeusinfra.io/activation?shop=${shop}&canceled=true`
    });

    return res.json({ url: session.url });

  } catch (err) {

    console.error("🔥 STRIPE ERROR:", err);

    if (err.raw) {
      console.error("🔥 STRIPE RAW:", err.raw);
    }

    return res.status(500).json({ error: err.message });
  }
});

/* ENV DEBUG */
console.log("ENV REAL:", {
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? "OK" : "MISSING",
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? "OK" : "MISSING",
  SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES ? "OK" : "MISSING"
});


function verifyShopifyWebhookHmac(req) {
  try {
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    const rawBody = req.rawBody;

    if (!hmacHeader || !rawBody) {
      return false;
    }

    const digest = crypto
     .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
      .update(rawBody)
      .digest("base64");

    const generated = Buffer.from(digest, "base64");
    const received = Buffer.from(String(hmacHeader), "base64");

    if (generated.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(generated, received);
  } catch (err) {
    console.error("HMAC ERROR:", err.message);
    return false;
  }
}

function isShopifyTestRequest(req) {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  return (
    !hmacHeader ||
    hmacHeader === "" ||
    hmacHeader === "undefined"
  );
}

// ==========================
// POST (REAL WEBHOOKS)
// ==========================

// 1. DATA REQUEST
app.post("/webhooks/customers/data_request", (req, res) => {
  console.log("📩 DATA REQUEST WEBHOOK");
  return res.status(200).send("OK");
});

// 2. CUSTOMER REDACT
app.post("/webhooks/customers/redact", (req, res) => {
  console.log("🧹 CUSTOMER REDACT WEBHOOK");
  return res.status(200).send("OK");
});

// 3. SHOP REDACT
app.post("/webhooks/shop/redact", (req, res) => {
  console.log("🏪 SHOP REDACT WEBHOOK");
  return res.status(200).send("OK");
});


// ==========================
// GET (SHOPIFY CHECK / BROWSER)
// ==========================

// 1. DATA REQUEST
app.get("/webhooks/customers/data_request", (req, res) => {
  return res.status(200).send("OK");
});

// 2. CUSTOMER REDACT
app.get("/webhooks/customers/redact", (req, res) => {
  return res.status(200).send("OK");
});

// 3. SHOP REDACT
app.get("/webhooks/shop/redact", (req, res) => {
  return res.status(200).send("OK");
});
app.get("/health/webhooks", async (req, res) => {
  try {
    res.json({
      ok: true,
      endpoints: [
        "/webhooks/customers/data_request",
        "/webhooks/customers/redact",
        "/webhooks/shop/redact"
      ],
      hmac: "enabled"
    });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});


/* ==========================
   OAUTH HELPERS
========================== */

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a || ""), "utf8");
  const bBuf = Buffer.from(String(b || ""), "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function buildShopifyCallbackUrl() {
  return "https://zeus-core-engine.onrender.com/auth/callback";
}

function validateRequiredOAuthEnv() {
  if (!process.env.SHOPIFY_API_KEY) throw new Error("SHOPIFY_API_KEY env missing");
  if (!process.env.SHOPIFY_API_SECRET) throw new Error("SHOPIFY_API_SECRET env missing");
  if (!process.env.SHOPIFY_APP_URL) throw new Error("SHOPIFY_APP_URL env missing");
}

function isValidShopifyShop(shop) {
  const s = normalizeShopDomain(shop);
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(s);
}

function buildOAuthState(shop) {
  const nonce = crypto.randomBytes(16).toString("hex");
  return `${nonce}.${normalizeShopDomain(shop)}`;
}

function parseOAuthState(state) {
  const raw = String(state || "");
  const parts = raw.split(".");
  if (parts.length < 3) {
    return { nonce: "", shop: "" };
  }
  const nonce = parts[0];
  const shop = parts.slice(1).join(".");
  return { nonce, shop };
}

function verifyShopifyHmac(query) {
  const queryCopy = { ...query };
  const receivedHmac = String(queryCopy.hmac || "");
  delete queryCopy.hmac;
  delete queryCopy.signature;

  const message = Object.keys(queryCopy)
    .sort()
    .map((key) => {
      const value = Array.isArray(queryCopy[key])
        ? queryCopy[key].join(",")
        : String(queryCopy[key] ?? "");
      return `${key}=${value}`;
    })
    .join("&");

  const generatedHmac = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return safeEqual(generatedHmac, receivedHmac);
}

/* ==========================
   SHOPIFY OAUTH
========================== */
app.get("/auth", async (req, res) => {
  try {
    validateRequiredOAuthEnv();

    const shop = normalizeShopDomain(req.query?.shop);

    if (!shop) {
      return res.status(400).json({
        ok: false,
        error: "shop requerido"
      });
    }

    if (!isValidShopifyShop(shop)) {
      return res.status(400).json({
        ok: false,
        error: "shop inválido"
      });
    }

    const state = buildOAuthState(shop);
    const redirectUri = buildShopifyCallbackUrl();

    const installUrl =
      `https://${shop}/admin/oauth/authorize` +
      `?client_id=${encodeURIComponent(SHOPIFY_API_KEY)}` +
      `&scope=${encodeURIComponent(SHOPIFY_SCOPES)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;

    log("OAUTH START", {
      shop,
      redirectUri,
      scopes: SHOPIFY_SCOPES
    });

    return res.redirect(installUrl);
  } catch (err) {
    console.error("auth error:", err.response?.data || err.message);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/auth/callback", async (req, res) => {
  try {
    validateRequiredOAuthEnv();

    const code = String(req.query?.code || "");
    const hmac = String(req.query?.hmac || "");
    const host = String(req.query?.host || "");

    if (!code || !hmac || !host) {
      return res.status(400).json({
        ok: false,
        error: "OAuth missing required params"
      });
    }

    // 🔥 EXTRAER SHOP DESDE HOST (SHOPIFY NUEVO)
    let shop = "";

    try {
      const decodedHost = Buffer.from(host, "base64").toString("utf8");
      // ej: admin.shopify.com/store/zeus-dev-01
      const match = decodedHost.match(/store\/([^\/]+)/);

      if (match) {
        shop = `${match[1]}.myshopify.com`;
      }
    } catch (e) {
      return res.status(400).json({
        ok: false,
        error: "Invalid host param"
      });
    }

    if (!shop) {
      return res.status(400).json({
        ok: false,
        error: "Shop not resolved from host"
      });
    }

    if (!isValidShopifyShop(shop)) {
      return res.status(400).json({
        ok: false,
        error: "shop inválido"
      });
    }

    if (!verifyShopifyHmac(req.query)) {
      return res.status(400).json({
        ok: false,
        error: "HMAC inválido"
      });
    }

    // 🔥 INTERCAMBIO TOKEN
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const access_token = tokenResponse?.data?.access_token;
    const scope = tokenResponse?.data?.scope;

    if (!access_token) {
      throw new Error("OAuth exchange sin access_token");
    }

    const store = await upsertStore({
      shop,
      access_token,
      status: "active"
    });

    await registerWebhooks(shop, access_token);

    log("OAUTH SUCCESS", {
      shop,
      token_prefix: String(access_token).slice(0, 8),
      scope
    });

    return res.redirect(`/activation?shop=${shop}`);

  } catch (err) {
    console.error("auth/callback error:", err.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: err.response?.data || err.message
    });
  }
});

/* ==========================
   CONFIG NEGOCIO
========================== */

const USD_TO_MXN = 20;
const FIXED_STOCK = 11;

const DEFAULT_WEIGHT_VALUE = 1;
const DEFAULT_WEIGHT_UNIT = "kg";

const PRODUCT_API_VERSION = "2024-01";
const FULFILLMENT_API_VERSION = "2026-01";

// Shopify rate limit safety
const SHOPIFY_MIN_INTERVAL_MS = 650;

// Retry control
const MAX_RETRIES = 6;
const BASE_BACKOFF_MS = 800;

// Espera post-create para que Shopify materialice variantes/inventory_item_id
const PRODUCT_CREATE_WARMUP_MS = 1800;

/* ==========================
   ZEUS COMPLIANCE (paramétrico)
========================== */

const DEFAULT_BANNED_WORDS = [
  "imitacion",
  "imitación",
  "replica",
  "réplica",
  "falsificado",
  "copia",
  "clon",
  "cerveza",
  "granada",
  "arma",
  "pistola",
  "rifle",
  "municion",
  "munición",
  "cuchillo",
  "navaja"
];

/* ==========================
   ORIGEN AUTORIZADO + DEDUP
========================== */

const USADROP_SKU_REGEX = /^PD\.\d+$/i;
const ZEUS_SIGNATURE_TAG_PREFIX = "ZEUS_SIG_";

function isValidUsadropSku(sku) {
  const s = (sku || "").trim();
  return USADROP_SKU_REGEX.test(s);
}

function normalizeForSignature(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function computeProductSignature(imageKey, variantCount = 0) {
  const payload = {
    img: String(imageKey || "").trim().toLowerCase(),
    vc: Number.isFinite(Number(variantCount)) ? Number(variantCount) : 0
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 16);
}

function buildTagSetFromProduct(product, extraTags = []) {
  const existing = (product?.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const all = [...existing, ...extraTags]
    .map((t) => String(t || "").trim())
    .filter(Boolean);

  return Array.from(new Set(all));
}

async function findProductsByTag(shop, access_token, tag) {
  const q = `
    query ($query: String!) {
      products(first: 5, query: $query) {
        edges { node { id } }
      }
    }`;

  const data = await shopifyGraphQL(shop, access_token, q, { query: `tag:${tag}` });

  const edges = data?.data?.products?.edges || data?.products?.edges || [];
  return edges
    .map((e) => e?.node?.id)
    .filter(Boolean)
    .map((gid) => String(gid).split("/").pop());
}

function getBannedWords() {
  const extra = (process.env.ZEUS_BANNED_WORDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const all = [...DEFAULT_BANNED_WORDS, ...extra];
  return Array.from(new Set(all.map((w) => w.toLowerCase())));
}

const LEATHER_WORDS = ["cuero", "piel genuina", "piel real"];
const LEATHER_REPLACEMENT = "piel sintética";

/* ==========================
   MARKETPLACE BLOCK LIST (STRUCTURAL)
========================== */

const MARKETPLACE_BLOCK_WORDS = [
  "defensa",
  "autodefensa",
  "self defense",
  "self-defense",
  "arma",
  "weapon",
  "knife",
  "cuchillo",
  "navaja",
  "dagger",
  "espiga",
  "punta",
  "táctico",
  "tactico",
  "municion",
  "munición",
  "ammunition",
  "granada",
  "explosivo",
  "pistola",
  "rifle",
  "gun",
  "firearm"
];

function isBlockedProduct(title, bodyHtml) {
  const t = String(title || "").toLowerCase();
  const b = cheerio.load(bodyHtml || "", { decodeEntities: false }).text().toLowerCase();
  return MARKETPLACE_BLOCK_WORDS.some((w) => t.includes(w) || b.includes(w));
}

/* ==========================
   IMAGE FALLBACK FROM HTML
========================== */

function extractFirstImageFromHtml(html) {
  const $ = cheerio.load(html || "", { decodeEntities: false });
  const img = $("img").first();
  const src = img.attr("src");
  if (!src) return null;

  const s = String(src).trim();
  if (!s) return null;
  if (s.startsWith("data:")) return null;
  return s;
}

function normalizeImageFingerprint(src) {
  if (!src || typeof src !== "string") return "";
  let clean = src.trim();
  clean = clean.replace(/^['"]|['"]$/g, "");
  clean = clean.split("#")[0].split("?")[0];

  try {
    if (/^https?:\/\//i.test(clean)) {
      const u = new URL(clean);
      clean = (u.pathname || "").toLowerCase();
    } else {
      clean = clean.toLowerCase();
    }
  } catch (_) {
    clean = clean.toLowerCase();
  }

  const parts = clean.split("/").filter(Boolean);
  const last = parts.length ? parts[parts.length - 1] : clean;
  return last || "";
}

function extractImageFingerprintsFromHtml(html, limit = 3) {
  if (!html || typeof html !== "string") return [];
  const out = [];
  const imgTagRegex = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgTagRegex.exec(html)) !== null) {
    const fp = normalizeImageFingerprint(m[1]);
    if (fp) out.push(fp);
    if (out.length >= limit) break;
  }
  return out;
}

function buildImageFingerprintKey(realProduct, limit = 3) {
  const fps = [];

  const imgs = Array.isArray(realProduct?.images) ? realProduct.images : [];
  for (const img of imgs) {
    const src = img?.src || img?.url || img?.originalSrc;
    const fp = normalizeImageFingerprint(src);
    if (fp) fps.push(fp);
    if (fps.length >= limit) break;
  }

  const htmlFps = extractImageFingerprintsFromHtml(realProduct?.body_html || "", limit);
  for (const fp of htmlFps) {
    if (fp) fps.push(fp);
    if (fps.length >= limit * 2) break;
  }

  const seen = new Set();
  const uniq = [];
  for (const fp of fps) {
    if (!fp) continue;
    if (seen.has(fp)) continue;
    seen.add(fp);
    uniq.push(fp);
    if (uniq.length >= limit) break;
  }

  return uniq.join("|");
}

async function ensureMainImage(shop, access_token, productId, realProduct) {
  if (Array.isArray(realProduct?.images) && realProduct.images.length > 0) return;

  const fallbackImage = extractFirstImageFromHtml(realProduct?.body_html);
  if (!fallbackImage) {
    log("No fallback image found", { shop, productId });
    return;
  }

  await shopifyRequest(shop, {
    method: "POST",
    url: `https://${shop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}/images.json`,
    headers: { "X-Shopify-Access-Token": access_token },
    data: { image: { src: fallbackImage } }
  });

  log("Fallback image applied", { shop, productId, fallbackImage });
}

/* ==========================
   POSTGRES
========================== */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shop_tokens (
      shop TEXT PRIMARY KEY,
      access_token TEXT NOT NULL
    );
  `);
  console.log("shop_tokens table ready");
}

/* ==========================
   LOGS
========================== */

function nowIso() {
  return new Date().toISOString();
}

function log(tag, obj) {
  console.log(`[${nowIso()}] ${tag}`, obj ?? "");
}

/* ==========================
   STORE LAYER
========================== */

function normalizeShopDomain(shop) {
  return String(shop || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^admin\.shopify\.com\/store\//, "")
    .replace(/\/+$/, "");
}

function validateStore(store) {
  if (!store) throw new Error("STORE NOT REGISTERED");
  if (!store.access_token) throw new Error("STORE WITHOUT TOKEN");

  const status = String(store.status || "active").toLowerCase();
  if (status !== "active") {
    throw new Error(`STORE NOT ACTIVE: ${status}`);
  }
}

async function getStore(shop) {
  const normalizedShop = normalizeShopDomain(shop);

  const result = await pool.query(
    "SELECT * FROM stores WHERE shop = $1",
    [normalizedShop]
  );

  if (!result.rows.length) {
    throw new Error("STORE NOT REGISTERED");
  }

  const store = result.rows[0];

  console.log("ZEUS STORE DEBUG:", {
    shop: normalizedShop,
    hasToken: !!store.access_token,
    status: store.status
  });

  validateStore(store);
  return store;
}

async function upsertStore(data) {
  const {
    shop,
    access_token,
    region = "global",
    language = "es",
    currency = "USD",
    marketplace = "shopify",
    plan = "free",
    billing_status = "active",
    sku_limit = 20,
    tokens = 5
  } = data;

  const normalizedShop = normalizeShopDomain(shop);

  console.log("ZEUS UPSERT STORE:", {
    shop: normalizedShop,
    tokenPrefix: String(access_token || "").slice(0, 12),
    tokenLength: String(access_token || "").length
  });

console.log("TOKENS DEBUG:", {
  tokens,
  plan,
  billing_status
});
  
const result = await pool.query(
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
    tokens_used,
    tokens_balance,
    installed_at,
    activated_at
  )
  VALUES (
    $1,                -- shop
    $2,                -- access_token
    'shopify',
    'active',
    $3,                -- region
    $4,                -- language
    $5,                -- currency
    $6,                -- marketplace
    $7,                -- plan
    $8,                -- billing_status
    $9,                -- sku_limit
    $10,               -- tokens
    0,                 -- tokens_used
    $10,               -- tokens_balance (inicial = tokens)
    NOW(),
    NOW()
  )
  ON CONFLICT (shop)
  DO UPDATE SET
    access_token = EXCLUDED.access_token,
    platform = 'shopify',
    status = 'active',

    region = COALESCE(stores.region, EXCLUDED.region),
    language = COALESCE(stores.language, EXCLUDED.language),
    currency = COALESCE(stores.currency, EXCLUDED.currency),
    marketplace = COALESCE(stores.marketplace, EXCLUDED.marketplace),

    plan = COALESCE(stores.plan, EXCLUDED.plan),
    billing_status = COALESCE(stores.billing_status, EXCLUDED.billing_status),
    sku_limit = COALESCE(stores.sku_limit, EXCLUDED.sku_limit),

    tokens = COALESCE(stores.tokens, EXCLUDED.tokens),

    tokens_used = COALESCE(stores.tokens_used, 0),

    tokens_balance = CASE
      WHEN stores.tokens_balance IS NULL OR stores.tokens_balance = 0
        THEN EXCLUDED.tokens
      ELSE stores.tokens_balance
    END,

    activated_at = COALESCE(stores.activated_at, NOW()),
    updated_at = NOW()

  RETURNING *;
  `,
  [
    normalizedShop,
    access_token,
    region,
    language,
    currency,
    marketplace,
    plan,
    billing_status,
    sku_limit,
    tokens   // ← este debe ser 5 para FREE
  ]
);

  await pool.query(
    `
    INSERT INTO shop_tokens (shop, access_token)
    VALUES ($1, $2)
    ON CONFLICT (shop)
    DO UPDATE SET access_token = EXCLUDED.access_token
    `,
    [normalizedShop, access_token]
  );

  return result.rows[0];
}

async function getToken(shop) {
  const normalizedShop = normalizeShopDomain(shop);

  console.log("ZEUS GETTOKEN REQUEST:", {
    inputShop: shop,
    normalizedShop
  });

  try {
    const store = await getStore(normalizedShop);

    const token = store.access_token;

    console.log("ZEUS GETTOKEN DEBUG:", {
      shop: normalizedShop,
      source: "stores",
      tokenPrefix: String(token || "").slice(0, 12),
      tokenLength: String(token || "").length,
      hasToken: !!token
    });

    return token;
  } catch (storeErr) {
    console.error("❌ GETTOKEN FAILED:", {
      shop: normalizedShop,
      error: storeErr.message
    });

    throw new Error("STORE INVALID OR INACTIVE");
  }
}

/* ==========================
   REGISTER STORE
========================== */
app.post("/register-store", async (req, res) => {
  try {
    const {
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
    } = req.body || {};

    if (!shop || !access_token) {
      return res.status(400).json({
        ok: false,
        error: "Body requerido: { shop, access_token }"
      });
    }

    const store = await upsertStore({
      shop,
      access_token,
      region,
      language,
      currency,
      marketplace,
      plan,
      billing_status,
      sku_limit,
      tokens,
      status: "active"
    });

    return res.json({
      ok: true,
      store
    });

  } catch (err) {
    console.error("register-store error:", err.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/* ==========================
   COLA EN MEMORIA (por shop)
========================== */

const shopQueues = new Map();

function getShopQueue(shop) {
  const normalizedShop = normalizeShopDomain(shop);

  if (!shopQueues.has(normalizedShop)) {
    shopQueues.set(normalizedShop, { queue: [], processing: false, lastReqAt: 0 });
  }
  return shopQueues.get(normalizedShop);
}

// 🔒 ZEUS GLOBAL GUARDED ENQUEUE (ANTI-FUGA TOKENS)
async function enqueueShopJob(shop, jobName, fn) {
  try {
    const store = await getStore(shop);

    if (!store) {
      console.log("⛔ GLOBAL BLOCK - NO STORE", { shop });
      return;
    }

    if (String(store.status).toLowerCase() !== "active") {
      console.log("⛔ GLOBAL BLOCK - INACTIVE", { shop, status: store.status });
      return;
    }
const remaining = Number(store.tokens_balance ?? store.tokens ?? 0);
    if (remaining <= 0) {
  console.log("⛔ BLOCK - NO TOKENS", {
    shop,
    tokens: store.tokens,
    tokens_balance: store.tokens_balance
  });
  return;
}

  } catch (err) {
    console.log("⛔ GLOBAL BLOCK - STORE ERROR", { shop, error: err.message });
    return;
  }

  const normalizedShop = normalizeShopDomain(shop);
  const q = getShopQueue(normalizedShop);
  const jobId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  q.queue.push({ jobId, jobName, fn });
  log("QUEUE: enqueued", {
    shop: normalizedShop,
    jobName,
    jobId,
    depth: q.queue.length
  });

  processShopQueue(normalizedShop).catch((err) => {
    console.error("QUEUE processor error:", err.message);
  });

  return jobId;
}

async function processShopQueue(shop) {
  const normalizedShop = normalizeShopDomain(shop);
  const q = getShopQueue(normalizedShop);
  if (q.processing) return;

  q.processing = true;
  try {
    while (q.queue.length > 0) {
      const item = q.queue.shift();

      log("QUEUE: start", {
        shop: normalizedShop,
        jobName: item.jobName,
        jobId: item.jobId,
        remaining: q.queue.length
      });

      try {
        await item.fn();

        log("QUEUE: done", {
          shop: normalizedShop,
          jobName: item.jobName,
          jobId: item.jobId
        });

      } catch (err) {
        console.error("QUEUE: job failed", {
          shop: normalizedShop,
          jobName: item.jobName,
          jobId: item.jobId,
          error: err.response?.data || err.message
        });
      }
    }
  } finally {
    q.processing = false;
  }
}

/* ==========================
   THROTTLE + RETRY SHOPIFY
========================== */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttleShopify(shop) {
  const normalizedShop = normalizeShopDomain(shop);
  const q = getShopQueue(normalizedShop);
  const elapsed = Date.now() - q.lastReqAt;
  const wait = Math.max(0, SHOPIFY_MIN_INTERVAL_MS - elapsed);
  if (wait > 0) await sleep(wait);
  q.lastReqAt = Date.now();
}

function getRetryAfterMs(error) {
  const ra = error?.response?.headers?.["retry-after"];
  if (!ra) return null;
  const seconds = Number(ra);
  if (!Number.isFinite(seconds)) return null;
  return Math.max(0, seconds * 1000);
}

async function shopifyRequest(shop, config, attempt = 0) {
  const normalizedShop = normalizeShopDomain(shop);
  await throttleShopify(normalizedShop);

  try {
    return await axios(config);
  } catch (err) {
    const status = err?.response?.status;
    const retriable = status === 429 || (status >= 500 && status <= 599);

    if (!retriable || attempt >= MAX_RETRIES) throw err;

    const retryAfter = getRetryAfterMs(err);
    const backoff = retryAfter ?? BASE_BACKOFF_MS * Math.pow(2, attempt);
    log("Shopify retry", { shop: normalizedShop, status, attempt: attempt + 1, wait_ms: backoff });

    await sleep(backoff);
    return shopifyRequest(normalizedShop, config, attempt + 1);
  }
}

async function upsertProductMetafield({
  shop,
  access_token,
  productId,
  namespace,
  key,
  value,
  type = "single_line_text_field"
}) {
  if (!shop || !access_token || !productId || !namespace || !key) return null;

  const normalizedShop = normalizeShopDomain(shop);
  const base = `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}`;

  try {
    const listUrl = `${base}/products/${productId}/metafields.json?namespace=${encodeURIComponent(namespace)}&key=${encodeURIComponent(key)}`;
    const list = await shopifyRequest(normalizedShop, {
      method: "GET",
      url: listUrl,
      headers: { "X-Shopify-Access-Token": access_token }
    });

    const items = list?.data?.metafields || [];
    const found = items[0];

    if (found?.id) {
      const putUrl = `${base}/metafields/${found.id}.json`;
      const res = await shopifyRequest(normalizedShop, {
        method: "PUT",
        url: putUrl,
        headers: { "X-Shopify-Access-Token": access_token },
        data: {
          metafield: {
            id: found.id,
            value: String(value ?? ""),
            type
          }
        }
      });
      return res?.data?.metafield || null;
    }

    const postUrl = `${base}/products/${productId}/metafields.json`;
    const res = await shopifyRequest(normalizedShop, {
      method: "POST",
      url: postUrl,
      headers: { "X-Shopify-Access-Token": access_token },
      data: {
        metafield: {
          namespace,
          key,
          value: String(value ?? ""),
          type
        }
      }
    });
    return res?.data?.metafield || null;
  } catch (e) {
    console.log("[metafield] upsert failed:", e?.message || e);
    return null;
  }
}

/* ==========================
   PRICING - BLINDAJE MEDIO
========================== */

function calculatePrice(usdRaw) {
  const usd = Number(usdRaw);
  let adjustedUsd = Number.isFinite(usd) ? usd : 0;

  if (adjustedUsd <= 8) adjustedUsd *= 2.1;
  else if (adjustedUsd <= 20) adjustedUsd *= 1.9;
  else if (adjustedUsd <= 40) adjustedUsd *= 1.75;
  else if (adjustedUsd <= 80) adjustedUsd *= 1.65;
  else adjustedUsd *= 1.55;

  let mxn = adjustedUsd * USD_TO_MXN;
  mxn += 350;
  mxn *= 1.16;

  mxn = Math.ceil(mxn / 10) * 10 - 1;

  if ((mxn >= 300 && mxn <= 600) || (mxn >= 700 && mxn <= 740)) {
    mxn = 699;
  }

  return Math.max(599, mxn);
}

/* ==========================
   CATEGORÍA SIMPLE
========================== */

function detectCategory(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("bag") || t.includes("bolsa")) return "BOLSOS";
  if (t.includes("massage") || t.includes("masaje")) return "TERAPIA";
  if (t.includes("led")) return "ILUMINACION";
  if (t.includes("chair") || t.includes("silla")) return "HOGAR";
  return "GENERAL";
}

/* ==========================
   TRADUCCIÓN + HTML PRESERVANDO TAGS
========================== */

async function translateText(text) {
  if (!text || !text.trim()) return text;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
Traduce al español de México.
Optimiza ligeramente para SEO sin exagerar.
No agregues más de 1 palabra estratégica.
No cambies el significado original.
No uses adjetivos vacíos como "increíble", "mejor", "premium".
Mantén máximo 65 caracteres si es posible.
Devuelve solo el texto final.
`
          },
          { role: "user", content: text }
        ]
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
    );

    return response.data.choices?.[0]?.message?.content?.trim() ?? text;
  } catch (err) {
    log("Traducción omitida", err.response?.data || err.message);
    return text;
  }
}

async function translateHtmlPreservingTags(html) {
  const $ = cheerio.load(html || "", { decodeEntities: false });
  const textNodes = [];

  function walk(node) {
    if (!node) return;
    if (node.type === "text") {
      const raw = node.data;
      if (raw && raw.trim()) textNodes.push(node);
    }
    if (node.children) node.children.forEach(walk);
  }

  walk($.root()[0]);

  for (const node of textNodes) {
    node.data = await translateText(node.data);
  }

  return $.root().html();
}

/* ==========================
   COMPLIANCE HELPERS
========================== */

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSpaces(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function detectMaterialHint(title, bodyHtml) {
  const bodyText = cheerio.load(bodyHtml || "", { decodeEntities: false }).text().toLowerCase();

  const hasPU =
    bodyText.includes(" material: pu") ||
    bodyText.includes("material: pu") ||
    bodyText.includes("material:pu") ||
    bodyText.includes("polyurethane") ||
    bodyText.includes("poliuretano") ||
    bodyText.includes("piel sintética") ||
    bodyText.includes("sintético") ||
    bodyText.includes("sintetico") ||
    bodyText.includes(" pu ") ||
    bodyText.includes(" pu,") ||
    bodyText.includes(" pu.");

  const saysLeather = String(title || "").toLowerCase().includes("cuero") || bodyText.includes("cuero");
  return { hasPU, saysLeather };
}

function sanitizeTextForMarketplace(text, materialHint) {
  let s = String(text || "");

  const bannedWords = getBannedWords();
  for (const w of bannedWords) {
    const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, "gi");
    s = s.replace(re, "");
  }

  if (materialHint?.hasPU) {
    for (const w of LEATHER_WORDS) {
      const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, "gi");
      s = s.replace(re, LEATHER_REPLACEMENT);
    }
  }

  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\[\s*\]/g, "");
  s = normalizeSpaces(s);

  return s;
}

function sanitizeHtmlForMarketplace(html, materialHint) {
  const $ = cheerio.load(html || "", { decodeEntities: false });

  function walk(node) {
    if (!node) return;
    if (node.type === "text" && node.data && node.data.trim()) {
      node.data = sanitizeTextForMarketplace(node.data, materialHint);
    }
    if (node.children) node.children.forEach(walk);
  }

  walk($.root()[0]);
  return $.root().html();
}

function ensureNonEmptyTitle(title, fallback) {
  const t = normalizeSpaces(title);
  if (t && t.length >= 3) return t;
  const fb = normalizeSpaces(fallback);
  if (fb && fb.length >= 3) return fb;
  return "Producto importado";
}

/* ==========================
   TRACKING HELPERS
========================== */

function pickTrackingNumberFromPayload(payload) {
  if (payload?.tracking_info?.number) return String(payload.tracking_info.number).trim();
  if (payload?.tracking_number) return String(payload.tracking_number).trim();
  if (Array.isArray(payload?.tracking_numbers) && payload.tracking_numbers.length) {
    return String(payload.tracking_numbers[0]).trim();
  }
  return null;
}

function detectAftershipCarrierSlug(trackingNumber, trackingCompanyRaw) {
  const tn = String(trackingNumber || "").trim();
  const tc = String(trackingCompanyRaw || "").toLowerCase();

  if (tc.includes("360lion")) return "360lion";
  if (tc.includes("ups") || tn.startsWith("1Z")) return "ups";
  if (tc.includes("fedex")) return "fedex";
  if (tc.includes("dhl")) return "dhl";
  if (tn.startsWith("JM")) return "360lion";

  return "other";
}

function buildAftershipUrl(carrierSlug, trackingNumber) {
  return `https://www.aftership.com/track/${carrierSlug}/${trackingNumber}`;
}

async function updateTrackingOnFulfillment(shop, access_token, fulfillmentId, carrierSlug, trackingNumber, trackingUrl) {
  const normalizedShop = normalizeShopDomain(shop);

  const payload = {
    fulfillment: {
      notify_customer: false,
      tracking_info: {
        company: carrierSlug,
        number: trackingNumber,
        url: trackingUrl
      }
    }
  };

  await shopifyRequest(normalizedShop, {
    method: "POST",
    url: `https://${normalizedShop}/admin/api/${FULFILLMENT_API_VERSION}/fulfillments/${fulfillmentId}/update_tracking.json`,
    headers: { "X-Shopify-Access-Token": access_token },
    data: payload
  });
}

/* ==========================
   GRAPHQL HELPERS (SKUs -> product_ids)
========================== */

function gidToNumericId(gid) {
  if (!gid) return null;
  const m = String(gid).match(/\/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
}

async function shopifyGraphQL(shop, access_token, query, variables) {
  const normalizedShop = normalizeShopDomain(shop);

  const response = await shopifyRequest(normalizedShop, {
    method: "POST",
    url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/graphql.json`,
    headers: {
      "X-Shopify-Access-Token": access_token,
      "Content-Type": "application/json"
    },
    data: { query, variables }
  });

  return response.data;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function findProductIdsBySkus(shop, access_token, skus) {
  const normalizedShop = normalizeShopDomain(shop);
  const uniq = Array.from(new Set((skus || []).map((s) => String(s || "").trim()).filter(Boolean)));
  if (uniq.length === 0) return [];

  const productIds = new Set();
  const batches = chunk(uniq, 10);

  const GQL = `
    query($q: String!) {
      productVariants(first: 50, query: $q) {
        edges {
          node {
            sku
            product { id }
          }
        }
      }
    }
  `;

  for (const batch of batches) {
    const q = batch.map((s) => `sku:${s.replace(/"/g, "")}`).join(" OR ");
    const resp = await shopifyGraphQL(normalizedShop, access_token, GQL, { q });

    const edges = resp?.data?.productVariants?.edges || resp?.productVariants?.edges || [];
    for (const e of edges) {
      const pid = gidToNumericId(e?.node?.product?.id);
      if (pid) productIds.add(pid);
    }
  }

  return Array.from(productIds);
}

/* ==========================
   ZEUS DEDUPE MEMORY (ANTI DOUBLE EXECUTION)
========================== */

const zeusExecutionCache = new Map();

function isDuplicateExecution(shop, productId) {
  const key = `${shop}-${productId}`;
  const now = Date.now();

  if (zeusExecutionCache.has(key)) {
    const last = zeusExecutionCache.get(key);

    if (now - last < 30000) {
      return true;
    }
  }

  zeusExecutionCache.set(key, now);

  setTimeout(() => {
    zeusExecutionCache.delete(key);
  }, 60000);

  return false;
}

/* ==========================
   FULL MODE: PRODUCT TRANSFORM
========================== */

async function transformProductById(shop, access_token, productId) {
  const normalizedShop = normalizeShopDomain(shop);

  const store = await getStore(shop);

  if (!store) {
    console.log("⛔ HARD BLOCK - STORE NOT FOUND", { shop });
    return { success: false, hard_block: true };
  }

  if (String(store.status).toLowerCase() !== "active") {
    console.log("⛔ HARD BLOCK - STORE INACTIVE", { shop });
    return { success: false, hard_block: true };
  }

  const remaining = Number(store.tokens_balance ?? store.tokens ?? 0);

if (remaining <= 0) {
  console.log("⛔ HARD BLOCK WEBHOOK - NO TOKENS", {
    shop,
    tokens: store.tokens,
    tokens_balance: store.tokens_balance
  });
  return;
}

  try {
    await sleep(PRODUCT_CREATE_WARMUP_MS);

    const freshProduct = await shopifyRequest(normalizedShop, {
      method: "GET",
      url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
      headers: { "X-Shopify-Access-Token": access_token }
    });

    const realProduct = freshProduct.data.product;
    const realVariants = Array.isArray(realProduct?.variants) ? realProduct.variants : [];

    const invalidSkus = realVariants
      .map((v) => (v?.sku || "").trim())
      .filter((sku) => sku && !isValidUsadropSku(sku));

    if (invalidSkus.length) {
      await shopifyRequest(normalizedShop, {
        method: "PUT",
        url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
        headers: { "X-Shopify-Access-Token": access_token },
        data: {
          product: {
            id: productId,
            status: "draft",
            tags: buildTagSetFromProduct(realProduct, ["ORIGIN_NOT_AUTHORIZED"]).join(", ")
          }
        }
      });

      log("Producto bloqueado por ORIGEN AUTORIZADO", {
        shop: normalizedShop,
        productId
      });

      return { success: false, reason: "invalid_origin" };
    }

    if (isBlockedProduct(realProduct.title, realProduct.body_html)) {
      await shopifyRequest(normalizedShop, {
        method: "PUT",
        url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
        headers: { "X-Shopify-Access-Token": access_token },
        data: {
          product: {
            id: productId,
            status: "draft",
            tags: buildTagSetFromProduct(realProduct, ["BLOCKED_BY_POLICY"]).join(", ")
          }
        }
      });

      log("Producto bloqueado por política", {
        shop: normalizedShop,
        productId
      });

      return { success: false, reason: "blocked_policy" };
    }

    await ensureMainImage(normalizedShop, access_token, productId, realProduct);

    const imageKey = buildImageFingerprintKey(realProduct, 3);
    const sigHash = computeProductSignature(imageKey, realVariants.length);
    const sigTag = `${ZEUS_SIGNATURE_TAG_PREFIX}${sigHash}`;

    const dupIds = await findProductsByTag(normalizedShop, access_token, sigTag);
    const hasDup = dupIds.some((id) => String(id) !== String(productId));

    if (hasDup) {
      await shopifyRequest(normalizedShop, {
        method: "PUT",
        url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
        headers: { "X-Shopify-Access-Token": access_token },
        data: {
          product: {
            id: productId,
            status: "draft",
            tags: buildTagSetFromProduct(realProduct, ["DUPLICATE_SIGNATURE", sigTag]).join(", ")
          }
        }
      });

      log("Producto bloqueado por duplicidad", {
        shop: normalizedShop,
        productId,
        sigTag
      });

      return { success: false, reason: "duplicate" };
    }

    const materialHint = detectMaterialHint(realProduct.title, realProduct.body_html);

    const translatedTitleRaw = await translateText(realProduct.title);
    let translatedHtml = await translateHtmlPreservingTags(realProduct.body_html);

    let translatedTitle = sanitizeTextForMarketplace(translatedTitleRaw, materialHint);
    translatedHtml = sanitizeHtmlForMarketplace(translatedHtml, materialHint);

    translatedTitle = ensureNonEmptyTitle(translatedTitle, translatedTitleRaw);

    const detectedCat = detectCategory(translatedTitle);

    const tags = buildTagSetFromProduct(realProduct, [
      detectedCat,
      sigTag,
      "ZEUS_ORIGIN"
    ]).join(", ");

    await shopifyRequest(normalizedShop, {
      method: "PUT",
      url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
      headers: { "X-Shopify-Access-Token": access_token },
      data: {
        product: {
          id: productId,
          title: translatedTitle,
          body_html: translatedHtml,
          vendor: "friDker Internacional",
          product_type: detectedCat,
          tags,
          status: "active"
        }
      }
    });

    for (const variant of realVariants) {
  const usd = parseFloat(variant.price);
  const mxnPrice = calculatePrice(Number.isFinite(usd) ? usd : 0);

  await shopifyRequest(normalizedShop, {
    method: "PUT",
    url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/variants/${variant.id}.json`,
    headers: { "X-Shopify-Access-Token": access_token },
    data: {
      variant: {
        id: variant.id,
        price: String(mxnPrice),
        sku: variant.sku,
        weight: DEFAULT_WEIGHT_VALUE,
        weight_unit: DEFAULT_WEIGHT_UNIT
      }
    }
  });
}

// ==========================
// INVENTARIO FIJO (11)
// ==========================
await sleep(1800); // CRÍTICO (espera a que Shopify cree inventory_item_id)

const locationsResp = await shopifyRequest(normalizedShop, {
  method: "GET",
  url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/locations.json`,
  headers: { "X-Shopify-Access-Token": access_token }
});

const locationId = locationsResp.data?.locations?.[0]?.id;

if (!locationId) {
  console.log("❌ NO LOCATION FOUND", { shop: normalizedShop });
} else {
  for (const variant of realVariants) {
    if (!variant.inventory_item_id) {
      console.log("❌ NO inventory_item_id", { variantId: variant.id });
      continue;
    }

    await shopifyRequest(normalizedShop, {
      method: "POST",
      url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/inventory_levels/set.json`,
      headers: { "X-Shopify-Access-Token": access_token },
      data: {
        location_id: locationId,
        inventory_item_id: variant.inventory_item_id,
        available: FIXED_STOCK
      }
    });
  }

  console.log("✅ INVENTARIO SET A 11", {
    shop: normalizedShop,
    variants: realVariants.length
  });
}
    log("Producto transformado (FULL)", {
      shop: normalizedShop,
      productId,
      variants: realVariants.length
    });

    return { success: true };

  } catch (err) {
    console.error("transformProductById error:", err.response?.data || err.message);
    return { success: false, reason: "error" };
  }
}

/* ==========================
   STABLE MODE
========================== */

async function transformProductStableById(shop, access_token, productId) {
  const normalizedShop = normalizeShopDomain(shop);

  const freshProduct = await shopifyRequest(normalizedShop, {
    method: "GET",
    url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
    headers: { "X-Shopify-Access-Token": access_token }
  });

  const realProduct = freshProduct.data.product;
  const realVariants = Array.isArray(realProduct?.variants) ? realProduct.variants : [];

  const invalidSkus = realVariants
    .map((v) => (v?.sku || "").trim())
    .filter((sku) => sku && !isValidUsadropSku(sku));

  if (invalidSkus.length) {
    await shopifyRequest(normalizedShop, {
      method: "PUT",
      url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
      headers: { "X-Shopify-Access-Token": access_token },
      data: {
        product: {
          id: productId,
          status: "draft",
          tags: buildTagSetFromProduct(realProduct, ["ORIGIN_NOT_AUTHORIZED"]).join(", ")
        }
      }
    });
    log("Producto bloqueado por ORIGEN AUTORIZADO (SKU inválido)", {
      shop: normalizedShop,
      productId,
      invalidSkus: invalidSkus.slice(0, 10)
    });
    return;
  }

  if (isBlockedProduct(realProduct.title, realProduct.body_html)) {
    await shopifyRequest(normalizedShop, {
      method: "PUT",
      url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
      headers: { "X-Shopify-Access-Token": access_token },
      data: {
        product: {
          id: productId,
          status: "draft",
          tags: buildTagSetFromProduct(realProduct, ["BLOCKED_BY_POLICY"]).join(", ")
        }
      }
    });

    log("Producto bloqueado por política marketplace (STABLE)", {
      shop: normalizedShop,
      productId,
      title: realProduct.title
    });
    return;
  }

  await ensureMainImage(normalizedShop, access_token, productId, realProduct);

  const materialHint = detectMaterialHint(realProduct.title, realProduct.body_html);

  const translatedTitleRaw = await translateText(realProduct.title);
  let translatedHtml = await translateHtmlPreservingTags(realProduct.body_html);

  const titleBefore = translatedTitleRaw;
  let translatedTitle = sanitizeTextForMarketplace(translatedTitleRaw, materialHint);
  translatedHtml = sanitizeHtmlForMarketplace(translatedHtml, materialHint);

  translatedTitle = ensureNonEmptyTitle(translatedTitle, titleBefore);
  const detectedCat = detectCategory(translatedTitle);
  const tags = buildTagSetFromProduct(realProduct, [detectedCat]).join(", ");

  await shopifyRequest(normalizedShop, {
    method: "PUT",
    url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
    headers: { "X-Shopify-Access-Token": access_token },
    data: {
      product: {
        id: productId,
        title: translatedTitle,
        body_html: translatedHtml,
        vendor: "friDker Internacional",
        product_type: detectedCat,
        tags,
        status: "active"
      }
    }
  });

  log("Producto transformado (STABLE)", { shop: normalizedShop, productId });
}

/* ==========================
   CLEAN ONLY
========================== */

async function cleanProductById(shop, access_token, productId) {
  const normalizedShop = normalizeShopDomain(shop);

  const freshProduct = await shopifyRequest(normalizedShop, {
    method: "GET",
    url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
    headers: { "X-Shopify-Access-Token": access_token }
  });

  const realProduct = freshProduct.data.product;

  if (isBlockedProduct(realProduct.title, realProduct.body_html)) {
    await shopifyRequest(normalizedShop, {
      method: "PUT",
      url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
      headers: { "X-Shopify-Access-Token": access_token },
      data: {
        product: {
          id: productId,
          status: "draft",
          tags: buildTagSetFromProduct(realProduct, ["BLOCKED_BY_POLICY"]).join(", ")
        }
      }
    });

    log("Producto bloqueado por política marketplace (CLEAN)", {
      shop: normalizedShop,
      productId,
      title: realProduct.title
    });
    return;
  }

  await ensureMainImage(normalizedShop, access_token, productId, realProduct);

  const materialHint = detectMaterialHint(realProduct.title, realProduct.body_html);

  const translatedTitleRaw = await translateText(realProduct.title);
  let translatedHtml = await translateHtmlPreservingTags(realProduct.body_html);

  const titleBefore = translatedTitleRaw;
  let translatedTitle = sanitizeTextForMarketplace(translatedTitleRaw, materialHint);
  translatedHtml = sanitizeHtmlForMarketplace(translatedHtml, materialHint);

  translatedTitle = ensureNonEmptyTitle(translatedTitle, titleBefore);

  await shopifyRequest(normalizedShop, {
    method: "PUT",
    url: `https://${normalizedShop}/admin/api/${PRODUCT_API_VERSION}/products/${productId}.json`,
    headers: { "X-Shopify-Access-Token": access_token },
    data: {
      product: {
        id: productId,
        title: translatedTitle,
        body_html: translatedHtml
      }
    }
  });

  log("Producto limpiado (CLEAN ONLY)", { shop: normalizedShop, productId });
}

/* ==========================
   MANUAL ROUTES DISABLED
========================== */

app.post("/run-zeus", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "run-zeus"
  });
});

/* ==========================
   WEBHOOK: PRODUCTS CREATE (FULL)
========================== */

function getEffectiveTokensBalance(store) {
  const balance = Number(store?.tokens_balance);

  if (Number.isFinite(balance)) {
    return balance;
  }

  const legacyTokens = Number(store?.tokens);

  if (Number.isFinite(legacyTokens)) {
    return legacyTokens;
  }

  return 0;
}

async function checkStoreBilling(shop, meta = {}) {
  const normalizedShop = normalizeShopDomain(shop);
  const store = await getStore(normalizedShop);

  const remaining = getEffectiveTokensBalance(store);
  const allowed =
    String(store.status || "").toLowerCase() === "active" &&
    remaining > 0;

  log("ZEUS BILLING CHECK", {
    shop: normalizedShop,
    allowed,
    remaining,
    status: store.status,
    ...meta
  });

  return {
    store,
    allowed,
    remaining
  };
}

async function consumeTokenIfAvailable(shop, meta = {}) {
  const normalizedShop = normalizeShopDomain(shop);

  const result = await pool.query(
    `
    UPDATE stores
    SET
      tokens_used = COALESCE(tokens_used, 0) + 1,
      tokens_balance = COALESCE(tokens_balance, COALESCE(tokens, 0)) - 1,
      updated_at = NOW()
    WHERE shop = $1
      AND LOWER(COALESCE(status, 'inactive')) = 'active'
      AND COALESCE(tokens_balance, COALESCE(tokens, 0)) > 0
    RETURNING
      shop,
      tokens,
      tokens_used,
      tokens_balance,
      status
    `,
    [normalizedShop]
  );

  if (!result.rows.length) {
    log("ZEUS TOKEN CONSUMED", {
      shop: normalizedShop,
      ok: false,
      remaining: 0,
      reason: "no_tokens",
      ...meta
    });

    return {
      ok: false,
      remaining: 0
    };
  }

  const row = result.rows[0];
  const remaining = Number(row.tokens_balance || 0);

  log("ZEUS TOKEN CONSUMED", {
    shop: normalizedShop,
    ok: true,
    remaining,
    tokens_used: Number(row.tokens_used || 0),
    ...meta
  });

  return {
    ok: true,
    remaining,
    store: row
  };
}
  
app.post("/webhooks/products-create", async (req, res) => {
  console.log("🔥 WEBHOOK PRODUCTS CREATE HIT", {
    shop: req.headers["x-shopify-shop-domain"],
    body: req.body
  });

  const shop = normalizeShopDomain(req.headers["x-shopify-shop-domain"]);
  if (!shop) {
    console.log("❌ NO SHOP");
    return res.status(200).send("OK");
  }

  const productId = Number(req.body?.id);
  if (!productId) {
    console.log("❌ NO PRODUCT ID");
    return res.status(200).send("OK");
  }

  let store;

  try {
    store = await getStore(shop);
  } catch (err) {
    console.log("⛔ BLOCKED BEFORE QUEUE - STORE INVALID", { shop });
    return res.status(200).send("OK");
  }

  if (!store) {
    console.log("⛔ HARD BLOCK WEBHOOK - NO STORE", { shop });
    return res.status(200).send("OK");
  }

  if (String(store.status).toLowerCase() !== "active") {
    console.log("⛔ HARD BLOCK WEBHOOK - INACTIVE", { shop, status: store.status });
    return res.status(200).send("OK");
  }

  const remaining = Number(store.tokens_balance ?? store.tokens ?? 0);

  if (remaining <= 0) {
    console.log("⛔ BLOCK - NO TOKENS", {
      shop,
      tokens: store.tokens,
      tokens_balance: store.tokens_balance
    });
    return res.status(200).send("OK");
  }

  console.log("🚀 ABOUT TO ENQUEUE", { shop, productId });

  enqueueShopJob(shop, "products-create(FULL)", async () => {
  let jobStore;

  try {
    jobStore = await getStore(shop);
  } catch (err) {
    console.log("⛔ JOB BLOCK - STORE INVALID", { shop });
    return;
  }

  if (!jobStore) {
    console.log("⛔ JOB BLOCK - NO STORE", { shop });
    return;
  }

  if (String(jobStore.status).toLowerCase() !== "active") {
    console.log("⛔ JOB BLOCK - INACTIVE", { shop, status: jobStore.status });
    return;
  }

  const remaining = Number(jobStore.tokens_balance ?? jobStore.tokens ?? 0);

  if (remaining <= 0) {
    console.log("⛔ JOB BLOCK - NO TOKENS", { shop });
    return;
  }

  const access_token = await getToken(shop);

  const transformResult = await transformProductById(
    shop,
    access_token,
    productId
  );

  console.log("🔥 BEFORE TOKEN CONSUME", {
    shop,
    productId,
    transformResult
  });

  if (!transformResult?.success) {
    console.log("⚠️ TRANSFORM FAILED", { shop, productId });
    return;
  }

  await consumeTokenIfAvailable(shop, {
    source: "webhook",
    productId
  });

});

  return res.status(200).send("OK");

  });
  
/* ==========================
   WEBHOOK: FULFILLMENT TRACKING
========================== */

app.post("/webhook/fulfillment", async (req, res) => {
  res.status(200).send("ok");

  const shop = normalizeShopDomain(req.headers["x-shopify-shop-domain"]);
  const topic = req.headers["x-shopify-topic"];
  if (!shop) return;

  const payload = req.body || {};
  const trackingNumber = pickTrackingNumberFromPayload(payload);
  if (!trackingNumber) return;

  enqueueShopJob(shop, "fulfillment-tracking", async () => {
    const access_token = await getToken(shop);

    const carrierSlug = detectAftershipCarrierSlug(trackingNumber, payload?.tracking_company);
    const trackingUrl = buildAftershipUrl(carrierSlug, trackingNumber);

    if (payload?.id && String(topic).startsWith("fulfillments/")) {
      await updateTrackingOnFulfillment(shop, access_token, payload.id, carrierSlug, trackingNumber, trackingUrl);
      log("Tracking actualizado", { shop, fulfillmentId: payload.id, trackingUrl });
    }
  });
});

/* ==========================
   MANUAL ROUTES DISABLED
========================== */

app.post("/reconcile", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "reconcile"
  });
});

app.post("/reconcile-by-skus", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "reconcile-by-skus"
  });
});

app.post("/force-full", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "force-full"
  });
});

app.post("/force-full-by-skus", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "force-full-by-skus"
  });
});

app.post("/force-stable", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "force-stable"
  });
});

app.post("/force-stable-by-skus", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "force-stable-by-skus"
  });
});

/* ==========================
   ZEUS ONBOARDING OPTIMIZE (DISABLED)
========================== */

app.post("/optimize", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "DISABLED_ROUTE_SINGLE_SOURCE_WEBHOOKS",
    route: "optimize"
  });
});

/* ==========================
   STORE STATUS
========================== */

app.get("/api/store/status", async (req, res) => {
  try {
    const shop = normalizeShopDomain(req.query.shop);

    if (!shop) {
      return res.status(400).json({ error: "shop required" });
    }

    const result = await pool.query(
      `
      SELECT shop, plan, tokens, tokens_used, status
      FROM stores
      WHERE shop = $1
      LIMIT 1
      `,
      [shop]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "store not found" });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error("store/status error:", error);
    res.status(500).json({ error: "internal error" });
  }
});

/* ==========================
   ACTIVATION PAGE
========================== */
app.get("/", (req, res) => {
  const shop =
    req.query.shop ||
    req.headers['x-shopify-shop-domain'];

  if (!shop) {
    return res.send("ZEUS running 🚀");
  }

  console.log("FORCING AUTH FROM ROOT", { shop });

  return res.redirect(`/auth?shop=${shop}`);
});
     
/* ==========================
   BILLING (STRIPE REAL)
========================== */
// CREATE CHECKOUT SESSION
app.post("/stripe/create-checkout", async (req, res) => {
  try {
    const { shop, plan } = req.body;

    if (!shop || !plan) {
      return res.status(400).json({ error: "Missing shop or plan" });
    }

    const planMap = {
      starter: { price: 4900, tokens: 300 },
      growth: { price: 14900, tokens: 1000 },
      scale: { price: 29900, tokens: 3000 },
      powerful: { price: 69900, tokens: 50000 }
    };

    const selected = planMap[plan];

    if (!selected) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `ZEUS ${plan.toUpperCase()} PLAN`,
              description: `${selected.tokens} tokens`
            },
            unit_amount: selected.price
          },
          quantity: 1
        }
      ],
      metadata: {
        shop,
        tokens: selected.tokens
      },
      success_url: `${process.env.SHOPIFY_APP_URL}/activation?shop=${shop}&success=true`,
      cancel_url: `${process.env.SHOPIFY_APP_URL}/usadrop-partner`
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.error("STRIPE CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// STRIPE WEBHOOK
app.post("/stripe/webhook", async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {
    console.error("❌ STRIPE SIGNATURE ERROR:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const shop = session.metadata.shop;
    const tokens = parseInt(session.metadata.tokens || "0");

    console.log("💰 PAYMENT SUCCESS:", { shop, tokens });

    try {
      await db.query(`
        UPDATE stores
        SET tokens = tokens + $1,
            tokens_balance = tokens_balance + $1,
            status = 'active',
            billing_status = 'paid',
            updated_at = NOW()
        WHERE shop = $2
      `, [tokens, shop]);

      console.log("✅ TOKENS UPDATED:", shop);

    } catch (err) {
      console.error("❌ DB UPDATE ERROR:", err);
    }
  }

  res.json({ received: true });
});

/* ==========================
   HEALTH
========================== */
app.get("/activation", async (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop");
  }

  const store = await getStore(shop);

  // 🔥 SI NO HAY TOKEN OAuth REAL → FORZAR AUTH
 if (!store || !store.access_token) {
    console.log("FORCING AUTH FROM ACTIVATION", { shop });
    return res.redirect(`/auth?shop=${shop}`);
  }

  // ✅ SI TODO OK
  return res.send("ZEUS is ready 🚀");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    time: nowIso(),
    shopsInMemory: shopQueues.size,
    bannedWordsCount: getBannedWords().length,
    version: "zeus-transformer-v1.8.0-single-source-webhooks"
  });
});

/* ==========================
   TEST USADROP (DISABLED SAFE)
========================== */

if (false) {
  try {
    const { runUsadropSync } = require("./src/jobs/usadropSyncJob");

    setTimeout(async () => {
      console.log("🚀 TEST USADROP SYNC ====");
      await runUsadropSync();
    }, 5000);

  } catch (err) {
    console.log("USADROP JOB NOT FOUND (safe skip)");
  }
}

async function registerWebhooks(shop, accessToken) {
  try {
    const topics = [
  // ✅ COMPLIANCE
  { topic: "CUSTOMERS_DATA_REQUEST", path: "customers/data_request" },
  { topic: "CUSTOMERS_REDACT", path: "customers/redact" },
  { topic: "SHOP_REDACT", path: "shop/redact" },

  // 🔥 ZEUS CORE (SOLO CREATE)
  { topic: "PRODUCTS_CREATE", path: "webhooks/products-create" }
];

    for (const t of topics) {
      const response = await axios.post(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          query: `
            mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
              webhookSubscriptionCreate(
                topic: $topic,
                webhookSubscription: $webhookSubscription
              ) {
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            topic: t.topic,
            webhookSubscription: {
              callbackUrl: `https://zeus-core-engine.onrender.com/webhooks/${t.path}`,
              format: "JSON"
            }
          }
        },
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json"
          }
        }
      );

      // 🔥 IMPORTANTE: validar errores de Shopify
      const errors = response.data?.data?.webhookSubscriptionCreate?.userErrors;

      if (errors && errors.length > 0) {
        console.error("❌ Shopify webhook error:", errors);
      } else {
        console.log("✅ Webhook registered:", t.topic);
      }
    }

  } catch (err) {
    console.error("❌ registerWebhooks error:", err.response?.data || err.message);
  }
}
        
/* ========================================
   SERVER START (ÚNICO Y FINAL)
======================================== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, async () => {
  console.log(`🚀 ZEUS running on port ${PORT}`);

  try {
    if (typeof initDB === "function") {
      await initDB();
      console.log("✅ DB connected");
    }
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
  }
});
