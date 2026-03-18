require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

/*
DATABASE
*/

const { testConnection } = require("./src/services/database");

/*
ZEUS SERVICES
*/

const { transformProduct } = require("./src/services/productTransformer");
const { createJob } = require("./src/services/jobManager");
const { checkSkuLimit } = require("./src/services/skuLimiter");
const productRegistry = require("./src/services/productRegistry");
const { checkBillingAccess } = require("./src/services/billingLimiter");

const { resolveStoreProfile } = require("./src/services/storeProfileResolver");
const { mapRegionalCategory } = require("./src/services/regionalCategoryMapper");

/*
PIPELINES
*/

const { runImportPipeline } = require("./src/pipeline/importPipeline");

/*
IMPORTERS
*/

const { importUsadropProducts } = require("./src/importers/usadropImporter");

/*
SHOPIFY ROUTES
*/

const installRoutes = require("./src/routes/install");

/*
STORE REGISTRY
*/

const {
  getStore,
  initStoreRegistry,
  updateStorePlan
} = require("./src/services/storeRegistry");

/*
LOOP PROTECTION
*/

const { isZeusUpdate, markZeusUpdate } = require("./src/services/loopProtection");

/*
JOB QUEUE
*/

const { enqueueJob, getQueueStatus } = require("./src/services/jobQueue");

/*
STRIPE
*/

const stripeWebhook = require("./src/routes/stripeWebhook");
const stripeCheckout = require("./src/routes/stripeCheckout");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

/*
====================================================
STRIPE WEBHOOK
====================================================
*/

app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

/*
====================================================
BODY PARSER
====================================================
*/

app.use(express.json());

/*
====================================================
SHOPIFY RAW WEBHOOK BODY
====================================================
*/

app.use("/webhooks", express.raw({ type: "application/json" }));

/*
====================================================
SHOPIFY OAUTH
====================================================
*/

app.use("/", installRoutes);

/*
====================================================
STRIPE CHECKOUT
====================================================
*/

app.use("/", stripeCheckout);

/*
====================================================
STRIPE CREATE CHECKOUT SESSION
====================================================
*/

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { shopDomain, plan } = req.body;

    const priceMap = {
      starter: "price_1TBVe5KaxvMqjMvMZzC18M8h",
      growth: "price_1TBVfBKaxvMqjMvMRdrZ42fV",
      scale: "price_1TBVoQKaxvMqjMvMiJ2FFKlS",
      powerful: "price_1TBW2zKaxvMqjMvM5L0YoN2N"
    };

    if (!priceMap[plan]) {
      return res.status(400).json({ error: "invalid_plan" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: priceMap[plan],
          quantity: 1
        }
      ],
      success_url: `https://zeusinfra.io/success?shop=${shopDomain}`,
      cancel_url: `https://zeusinfra.io/cancel`,
      metadata: {
        shopDomain,
        plan
      }
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("STRIPE SESSION ERROR:", error);
    res.status(500).json({ error: "stripe_error" });
  }
});

/*
====================================================
VERIFY SHOPIFY WEBHOOK
====================================================
*/

function verifyShopifyWebhook(req) {
  if (process.env.ZEUS_ENV === "test") {
    console.log("ZEUS WEBHOOK TEST MODE ACTIVE");
    return true;
  }

  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  if (!hmacHeader) return false;

  let bodyBuffer;

  if (Buffer.isBuffer(req.body)) {
    bodyBuffer = req.body;
  } else {
    bodyBuffer = Buffer.from(JSON.stringify(req.body));
  }

  const generatedHash = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(bodyBuffer)
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

/*
====================================================
STATUS
====================================================
*/

app.get("/status", (req, res) => {
  res.json({
    system: "ZEUS CORE ENGINE",
    status: "running",
    queue: getQueueStatus()
  });
});

app.get("/", (req, res) => {
  res.json({
    system: "ZEUS CORE ENGINE",
    status: "running",
    queue: getQueueStatus()
  });
});

/*
====================================================
QUEUE STATUS
====================================================
*/

app.get("/queue/status", (req, res) => {
  res.json({
    system: "ZEUS JOB QUEUE",
    ...getQueueStatus()
  });
});

/*
====================================================
DEBUG BILLING ACTIVATION
====================================================
*/

app.get("/debug/activate-plan", (req, res) => {
  try {
    const { shop, plan } = req.query;

    if (!shop || !plan) {
      return res.status(400).json({
        error: "missing_params",
        required: ["shop", "plan"]
      });
    }

    const updatedStore = updateStorePlan(shop, {
      plan,
      status: "active",
      activatedAt: new Date().toISOString()
    });

    if (!updatedStore) {
      return res.status(404).json({
        error: "store_not_found",
        shop
      });
    }

    res.json({
      success: true,
      shop,
      plan,
      billing: updatedStore.billing
    });
  } catch (error) {
    console.error("DEBUG ACTIVATE ERROR:", error);
    res.status(500).json({
      error: "activation_failed"
    });
  }
});

/*
====================================================
PRODUCT OPTIMIZATION API
====================================================
*/

app.post("/optimize/product", (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({
      error: "Product title required"
    });
  }

  const user = {
    optimized_skus: 10,
    sku_limit: 100
  };

  const limitCheck = checkSkuLimit(user);

  if (!limitCheck.allowed) {
    return res.status(403).json({
      error: "SKU limit reached"
    });
  }

  const storeContext = resolveStoreProfile({
    payload: req.body,
    headers: req.headers
  });

  const job = createJob({
    title,
    description,
    storeProfile: storeContext.profile,
    store: storeContext.store
  });

  const result = transformProduct({
    title,
    description,
    storeProfile: storeContext.profile,
    storeContext: storeContext.store
  });

  const categoryMapping = mapRegionalCategory({
    baseCategory: result.category,
    storeProfile: storeContext.profile
  });

  const response = {
    jobId: job.id,
    status: "processed",
    store: storeContext.store,
    storeProfile: storeContext.profile,
    baseCategory: result.category,
    regionalCategory: categoryMapping.regionalCategory,
    result: {
      ...result,
      baseCategory: result.category,
      regionalCategory: categoryMapping.regionalCategory
    }
  };

  productRegistry.saveProduct(job.id, response);

  res.json(response);
});

/*
====================================================
IMPORT PIPELINE
====================================================
*/

app.post("/import/product", async (req, res) => {
  try {
    const payload = req.body;

    const job = createJob({
      type: "import",
      payload
    });

    const result = await runImportPipeline(payload);

    productRegistry.saveProduct(job.id, result);

    res.json(result);
  } catch (error) {
    console.error("IMPORT PIPELINE ERROR:", error);

    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

/*
====================================================
USADROP IMPORT
====================================================
*/

app.post("/import/usadrop", async (req, res) => {
  try {
    console.log("ZEUS USADROP IMPORT START");

    const result = await importUsadropProducts();

    res.json({
      engine: "ZEUS",
      importer: "USAdrop",
      status: "completed",
      imported: result.imported || 0,
      failed: result.failed || 0
    });
  } catch (error) {
    console.error("USADROP IMPORT ERROR:", error);

    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

/*
====================================================
SHOPIFY PRODUCT CREATE WEBHOOK
====================================================
*/

async function handleProductCreate(req, res) {
  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send("Invalid HMAC");
  }

  const product = Buffer.isBuffer(req.body)
    ? JSON.parse(req.body.toString())
    : req.body;

  const shop = req.headers["x-shopify-shop-domain"];

  console.log("SHOPIFY PRODUCT CREATE:", product.id);

  try {
    if (isZeusUpdate(product)) {
      console.log("ZEUS LOOP PREVENTED");
      return res.status(200).send("ok");
    }

    const { getStoreFresh } = require("./src/services/storeRegistry");

const store = await getStoreFresh(shop);

    if (!store) {
      console.log("ZEUS STORE NOT REGISTERED:", shop);
      return res.status(200).send("store_not_registered");
    }

    const billingCheck = checkBillingAccess(shop);
    console.log("ZEUS BILLING CHECK:", billingCheck);

    if (!billingCheck.allowed) {
      console.log("ZEUS PLAN LIMIT BLOCKED:", shop, billingCheck.reason);
      return res.status(200).send("plan_limit_blocked");
    }

    if (!store.accessToken) {
      console.log("ZEUS STORE TOKEN MISSING:", shop);
      return res.status(200).send("store_token_missing");
    }

    const payload = {
      title: product.title,
      description: product.body_html || "",
      tags: product.tags ? product.tags.split(",") : [],

      platform: "shopify",

      store: {
        shopDomain: store.shopDomain,
        accessToken: store.accessToken,
        productId: product.id
      },

      storeProfile: {
        region: "US",
        language: "en"
      },

      source: "shopify"
    };

    enqueueJob(
      async () => {
        const result = await runImportPipeline(payload);

        markZeusUpdate(product.id);

        console.log(
          "ZEUS PIPELINE COMPLETE:",
          result.baseCategory || result.category || "n/a"
        );
      },
      `shopify-products-create-${product.id}`
    );
  } catch (error) {
    console.error("SHOPIFY PIPELINE ENQUEUE FAILED:", error);
  }

  res.status(200).send("ok");
}

/*
WEBHOOK ROUTES
*/

app.post("/webhooks/products-create", handleProductCreate);
app.post("/webhooks/products/create", handleProductCreate);
app.post("/webhooks/products/update", handleProductCreate);

app.post("/webhooks/inventory-update", (req, res) => {
  res.status(200).send("ok");
});

app.post("/webhooks/inventory_levels/update", (req, res) => {
  res.status(200).send("ok");
});

/*
====================================================
DATABASE MIGRATION (CATEGORY BRAIN)
====================================================
*/

async function runZeusMigration() {
  const { Pool } = require("pg");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log("ZEUS DB MIGRATION START");

    await client.query(`
      CREATE TABLE IF NOT EXISTS zeus_category_mappings (
        id SERIAL PRIMARY KEY,
        zeus_key TEXT NOT NULL,
        external_category TEXT,
        external_path TEXT,
        platform TEXT,
        region TEXT,
        confidence NUMERIC(5,4) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS zeus_category_learning (
        id SERIAL PRIMARY KEY,
        store_domain TEXT,
        platform TEXT,
        input_title TEXT,
        input_tags TEXT,
        input_description TEXT,
        predicted_zeus_key TEXT,
        corrected_zeus_key TEXT,
        correction_source TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE zeus_category_mappings
      ADD COLUMN IF NOT EXISTS platform TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_mappings
      ADD COLUMN IF NOT EXISTS region TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_mappings
      ADD COLUMN IF NOT EXISTS external_category TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_mappings
      ADD COLUMN IF NOT EXISTS external_path TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_mappings
      ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4) DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE zeus_category_mappings
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      ALTER TABLE zeus_category_mappings
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS store_domain TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS platform TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS input_title TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS input_tags TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS input_description TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS predicted_zeus_key TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS corrected_zeus_key TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS correction_source TEXT;
    `);

    await client.query(`
      ALTER TABLE zeus_category_learning
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_zeus_cat_map_key
      ON zeus_category_mappings(zeus_key);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_zeus_cat_map_platform
      ON zeus_category_mappings(platform);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_zeus_cat_learning_store
      ON zeus_category_learning(store_domain);
    `);

    console.log("ZEUS DB MIGRATION OK");
  } catch (err) {
    console.error("ZEUS MIGRATION ERROR", err);
  } finally {
    client.release();
    await pool.end();
  }
}

/*
====================================================
SERVER
====================================================
*/

const PORT = process.env.PORT || 10000;

async function startServer() {
  await runZeusMigration();
  await initStoreRegistry();
  await testConnection();

  app.listen(PORT, () => {
    console.log("ZEUS CORE ENGINE running");
    console.log("PORT:", PORT);
  });
}

startServer().catch((error) => {
  console.error("ZEUS STARTUP ERROR:", error);
  process.exit(1);
});
