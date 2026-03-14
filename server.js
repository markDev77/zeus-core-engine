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
SHOPIFY PRODUCT UPDATER (SYNC ENGINE)
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
BODY PARSERS
====================================================
*/

/*
Shopify OAuth and API routes need JSON parser first
*/
app.use(express.json());

/*
====================================================
SHOPIFY INSTALL ROUTES (OAUTH)
====================================================
*/

app.use("/", installRoutes);

/*
====================================================
STRIPE WEBHOOK
====================================================
Stripe requires raw body, so it must be AFTER oauth routes
*/

app.use("/stripe/webhook", express.raw({ type: "application/json" }));
app.use("/", stripeWebhook);

/*
====================================================
SHOPIFY WEBHOOK HMAC VERIFICATION
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
STATUS CHECK
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

    if (!payload) {

      return res.status(400).json({
        error: "Product payload required"
      });

    }

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
USADROP IMPORT TRIGGER
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
CONSULTAR JOB
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
LISTAR JOBS
====================================================
*/

app.get("/jobs", (req, res) => {

  const jobs = productRegistry.getAllProducts();

  res.json(jobs);

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log("ZEUS CORE ENGINE RUNNING ON", PORT);

});
