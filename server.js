const express = require("express");
const crypto = require("crypto");

/*
ZEUS SERVICES
*/

const { transformProduct } = require("./src/services/productTransformer");
const { createJob } = require("./src/services/jobManager");
const { checkSkuLimit } = require("./src/services/skuLimiter");
const productRegistry = require("./src/services/productRegistry");

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

app.post("/webhooks/products-create", async (req, res) => {

  if (!verifyShopifyWebhook(req)) {

    return res.status(401).send("Invalid HMAC");

  }

  const product =
    Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;

  const shop = req.headers["x-shopify-shop-domain"];

  console.log("SHOPIFY PRODUCT CREATE:", product.id);

  try {

    if (isZeusUpdate(product)) {

      console.log("ZEUS LOOP PREVENTED");

      return res.status(200).send("ok");

    }

    const payload = {

      title: product.title,
      description: product.body_html || "",
      tags: product.tags ? product.tags.split(",") : [],

      platform: "shopify",

      store: {
        shopDomain: shop,
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
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

        console.log("ZEUS PIPELINE COMPLETE:", result.baseCategory || result.category || "n/a");
      },
      `shopify-products-create-${product.id}`
    );

  } catch (error) {

    console.error("SHOPIFY PIPELINE ENQUEUE FAILED:", error);

  }

  res.status(200).send("ok");

});

/*
====================================================
SHOPIFY INVENTORY UPDATE
====================================================
*/

app.post("/webhooks/inventory-update", async (req, res) => {

  if (!verifyShopifyWebhook(req)) {

    return res.status(401).send("Invalid HMAC");

  }

  const inventory =
    Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;

  console.log("SHOPIFY INVENTORY UPDATE:", inventory.inventory_item_id);

  res.status(200).send("ok");

});

/*
====================================================
JOB QUERY
====================================================
*/

app.get("/jobs/:id", (req, res) => {

  const job = productRegistry.getProduct(req.params.id);

  if (!job) {

    return res.status(404).json({
      error: "Job not found"
    });

  }

  res.json(job);

});

/*
====================================================
LIST JOBS
====================================================
*/

app.get("/jobs", (req, res) => {

  const jobs = productRegistry.getAllProducts();

  res.json(jobs);

});

/*
====================================================
SERVER
====================================================
*/

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log("ZEUS CORE ENGINE running");
  console.log("PORT:", PORT);

});
