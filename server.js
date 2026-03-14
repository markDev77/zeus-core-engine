const express = require("express");

const { transformProduct } = require("./src/services/productTransformer");
const { createJob } = require("./src/services/jobManager");
const { checkSkuLimit } = require("./src/services/skuLimiter");
const productRegistry = require("./src/services/productRegistry");

/*
NEW IMPORT PIPELINE
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

const app = express();

/*
MIDDLEWARE
Permite recibir JSON en POST
*/
app.use(express.json());

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

  const job = createJob({
    title,
    description
  });

  const result = transformProduct({
    title,
    description
  });

  productRegistry.saveProduct(job.id, result);

  res.json({
    jobId: job.id,
    status: "processed",
    result: result
  });

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
      payload: payload
    });

    const result = await importPipeline(payload, job.id);

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