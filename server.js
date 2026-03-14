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
const importPipeline = require("./src/pipeline/importPipeline");

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
IMPORTANT
Stripe webhook requires raw body
*/
app.use("/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

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
STRIPE WEBHOOK ROUTE
====================================================
*/
app.use("/", stripeWebhook);

/*
====================================================
SHOPIFY INSTALL ROUTES
====================================================
*/
app.use("/", installRoutes);

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

/*
ROOT CHECK
*/
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

  productRegistry.saveProduct(job.id, {
    status: "processed",
    engine: "ZEUS",
    origin: "optimize",
    store: storeContext.store,
    storeProfile: storeContext.profile,
    storeProfileResolution: storeContext.resolution,
    category: result.category,
    baseCategory: result.category,
    regionalCategory: categoryMapping.regionalCategory,
    confidence: result.categoryConfidence,
    product: {
      engine: result.engine,
      originalTitle: result.originalTitle,
      optimizedTitle: result.optimizedTitle,
      suggestedTags: result.suggestedTags,
      suggestedCategory: result.suggestedCategory,
      suggestedRegionalCategory: categoryMapping.regionalCategory,
      baseCategory: result.category,
      regionalCategory: categoryMapping.regionalCategory,
      categoryConfidence: result.categoryConfidence,
      title: result.title,
      description: result.description,
      tags: result.tags,
      category: result.category
    }
  });

  res.json(response);
});

app.get("/optimize/product", (req, res) => {
  res.json({
    engine: "ZEUS",
    endpoint: "/optimize/product",
    method: "POST",
    status: "active"
  });
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

    const source = payload.source || "external";

    const result = await importPipeline(
      payload,
      job.id,
      source,
      {
        headers: req.headers
      }
    );

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
SHOPIFY WEBHOOKS
====================================================
*/

/*
PRODUCT CREATED
*/
app.post("/webhooks/products-create", async (req, res) => {
  try {
    if (!verifyShopifyWebhook(req)) {
      return res.status(401).send("Invalid webhook signature");
    }

    const product = req.body;

    if (!product || !product.title) {
      return res.status(400).json({
        error: "Invalid product payload"
      });
    }

    console.log("SHOPIFY WEBHOOK: PRODUCT CREATE");

    const store = {
      shop: req.headers["x-shopify-shop-domain"],
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN
    };

    /*
    LOOP PROTECTION
    */
    if (product.id) {
      const zeusUpdate = await isZeusUpdate(store, product.id);

      if (zeusUpdate) {
        console.log("ZEUS LOOP PROTECTION: ignoring webhook");
        return res.status(200).send("Ignored ZEUS update");
      }
    }

    const result = transformProduct({
      title: product.title,
      description: product.body_html || ""
    });

    const categoryMapping = mapRegionalCategory({
      baseCategory: result.category,
      storeProfile: { country: "US", marketplace: "shopify", language: "en-US" }
    });

    const job = createJob({
      type: "shopify-product-create",
      payload: product
    });

    productRegistry.saveProduct(job.id, {
      status: "processed",
      origin: "shopify_webhook_create",
      category: result.category,
      baseCategory: result.category,
      regionalCategory: categoryMapping.regionalCategory,
      confidence: result.categoryConfidence,
      product: {
        engine: result.engine,
        originalTitle: result.originalTitle,
        optimizedTitle: result.optimizedTitle,
        suggestedTags: result.suggestedTags,
        suggestedCategory: result.suggestedCategory,
        suggestedRegionalCategory: categoryMapping.regionalCategory,
        baseCategory: result.category,
        regionalCategory: categoryMapping.regionalCategory,
        categoryConfidence: result.categoryConfidence,
        title: result.title,
        description: result.description,
        tags: result.tags,
        category: result.category
      }
    });

    /*
    SYNC ENGINE
    */
    if (product.id) {
      try {
        await updateShopifyProduct(
          store,
          product.id,
          {
            title: result.title,
            description: result.description,
            tags: result.tags,
            category: result.category
          }
        );

        await markZeusUpdate(store, product.id);

        console.log("ZEUS SYNC ENGINE UPDATED PRODUCT:", product.id);
      } catch (error) {
        console.error("ZEUS SYNC ENGINE ERROR:", error.message);
      }
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("WEBHOOK CREATE ERROR:", error);
    res.status(500).send("Webhook error");
  }
});

/*
PRODUCT UPDATED
*/
app.post("/webhooks/products-update", async (req, res) => {
  try {
    if (!verifyShopifyWebhook(req)) {
      return res.status(401).send("Invalid webhook signature");
    }

    const product = req.body;

    if (!product || !product.title) {
      return res.status(400).json({
        error: "Invalid product payload"
      });
    }

    console.log("SHOPIFY WEBHOOK: PRODUCT UPDATE");

    const store = {
      shop: req.headers["x-shopify-shop-domain"],
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN
    };

    if (product.id) {
      const zeusUpdate = await isZeusUpdate(store, product.id);

      if (zeusUpdate) {
        console.log("ZEUS LOOP PROTECTION: ignoring webhook");
        return res.status(200).send("Ignored ZEUS update");
      }
    }

    const result = transformProduct({
      title: product.title,
      description: product.body_html || ""
    });

    const categoryMapping = mapRegionalCategory({
      baseCategory: result.category,
      storeProfile: { country: "US", marketplace: "shopify", language: "en-US" }
    });

    const job = createJob({
      type: "shopify-product-update",
      payload: product
    });

    productRegistry.saveProduct(job.id, {
      status: "processed",
      origin: "shopify_webhook_update",
      category: result.category,
      baseCategory: result.category,
      regionalCategory: categoryMapping.regionalCategory,
      confidence: result.categoryConfidence,
      product: {
        engine: result.engine,
        originalTitle: result.originalTitle,
        optimizedTitle: result.optimizedTitle,
        suggestedTags: result.suggestedTags,
        suggestedCategory: result.suggestedCategory,
        suggestedRegionalCategory: categoryMapping.regionalCategory,
        baseCategory: result.category,
        regionalCategory: categoryMapping.regionalCategory,
        categoryConfidence: result.categoryConfidence,
        title: result.title,
        description: result.description,
        tags: result.tags,
        category: result.category
      }
    });

    if (product.id) {
      try {
        await updateShopifyProduct(
          store,
          product.id,
          {
            title: result.title,
            description: result.description,
            tags: result.tags,
            category: result.category
          }
        );

        await markZeusUpdate(store, product.id);

        console.log("ZEUS SYNC ENGINE UPDATED PRODUCT:", product.id);
      } catch (error) {
        console.error("ZEUS SYNC ENGINE ERROR:", error.message);
      }
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("WEBHOOK UPDATE ERROR:", error);
    res.status(500).send("Webhook error");
  }
});

/*
INVENTORY UPDATED
*/
app.post("/webhooks/inventory-update", async (req, res) => {
  try {
    if (!verifyShopifyWebhook(req)) {
      return res.status(401).send("Invalid webhook signature");
    }

    const payload = req.body;

    console.log("SHOPIFY WEBHOOK: INVENTORY UPDATE");

    const job = createJob({
      type: "shopify-inventory-update",
      payload
    });

    productRegistry.saveProduct(job.id, {
      status: "processed",
      origin: "shopify_inventory_update",
      product: payload
    });

    res.status(200).send("Inventory webhook processed");
  } catch (error) {
    console.error("WEBHOOK INVENTORY ERROR:", error);
    res.status(500).send("Webhook error");
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
