const express = require("express");
const crypto = require("crypto");

const { transformProduct } = require("./src/services/productTransformer");
const { createJob } = require("./src/services/jobManager");
const { checkSkuLimit } = require("./src/services/skuLimiter");
const productRegistry = require("./src/services/productRegistry");
const { resolveStoreProfile } = require("./src/services/storeProfileResolver");
const { mapRegionalCategory } = require("./src/services/regionalCategoryMapper");

/*
IMPORT PIPELINE
*/
const { runImportPipeline } = require("./src/pipeline/importPipeline");

/*
USADROP IMPORTER
*/
const { importUsadropProducts } = require("./src/importers/usadropImporter");

/*
SHOPIFY INSTALL ROUTES
*/
const installRoutes = require("./src/routes/install");

/*
SHOPIFY PRODUCT UPDATER
*/
const { updateShopifyProduct } = require("./src/services/shopifyProductUpdater");

/*
LOOP PROTECTION
*/
const { isZeusUpdate, markZeusUpdate } = require("./src/services/loopProtection");

/*
STRIPE BILLING
*/
const stripeWebhook = require("./src/routes/stripeWebhook");

const app = express();

/*
====================================================
BODY PARSER
====================================================
*/

app.use(express.json());

/*
====================================================
SHOPIFY OAUTH
====================================================
*/

app.use("/", installRoutes);

/*
====================================================
STRIPE WEBHOOK
====================================================
*/

app.use("/stripe/webhook", express.raw({ type: "application/json" }));
app.use("/", stripeWebhook);

/*
====================================================
SHOPIFY WEBHOOK VERIFY
====================================================
*/

function verifyShopifyWebhook(req) {

  const hmacHeader = req.headers["x-shopify-hmac-sha256"];

  if (!hmacHeader) {
    return false;
  }

  const generatedHash = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(JSON.stringify(req.body), "utf8")
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
SHOPIFY WEBHOOKS
====================================================
*/

app.post("/webhooks/products-create", async (req, res) => {

  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send("Invalid webhook");
  }

  const product = req.body;

  console.log("SHOPIFY PRODUCT CREATE:", product.id);

  res.status(200).send("ok");

});

app.post("/webhooks/products-update", async (req, res) => {

  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send("Invalid webhook");
  }

  const product = req.body;

  if (isZeusUpdate(product)) {
    return res.status(200).send("Ignored ZEUS update");
  }

  console.log("SHOPIFY PRODUCT UPDATE:", product.id);

  res.status(200).send("ok");

});

app.post("/webhooks/inventory-update", async (req, res) => {

  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send("Invalid webhook");
  }

  const inventory = req.body;

  console.log("SHOPIFY INVENTORY UPDATE:", inventory.inventory_item_id);

  res.status(200).send("ok");

});

/*
====================================================
STATUS
====================================================
*/

app.get("/status", (req, res) => {

  res.json({
    system: "ZEUS CORE ENGINE",
    service: "core-engine",
    status: "running"
  });

});

app.get("/", (req, res) => {

  res.json({
    system: "ZEUS CORE ENGINE",
    status: "running"
  });

});

/*
====================================================
ZEUS PRODUCT OPTIMIZATION
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
    storeProfileResolution: storeContext.resolution,
    baseCategory: result.category,
    regionalCategory: categoryMapping.regionalCategory,
    result: {
      ...result,
      baseCategory: r
