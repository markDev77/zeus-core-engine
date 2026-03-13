const express = require("express");

const { transformProduct } = require("./src/services/productTransformer");
const { createJob } = require("./src/services/jobManager");
const { checkSkuLimit } = require("./src/services/skuLimiter");
const productRegistry = require("./src/services/productRegistry");

const app = express();

/*
MIDDLEWARE
Permite recibir JSON en POST
*/
app.use(express.json());

/*
ROOT CHECK
Verifica que ZEUS esté activo
*/
app.get("/", (req, res) => {
  res.json({
    system: "ZEUS CORE ENGINE",
    status: "running"
  });
});

/*
ZEUS PRODUCT OPTIMIZATION ENDPOINT
POST
Aquí llegará información de producto desde Shopify, Woo o importadores
*/
app.post("/optimize/product", (req, res) => {

  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({
      error: "Product title required"
    });
  }

  /*
  Usuario simulado
  (después vendrá de la base de datos)
  */
  const user = {
    optimized_skus: 10,
    sku_limit: 100
  };

  /*
  Verificar límite de SKUs
  */
  const limitCheck = checkSkuLimit(user);

  if (!limitCheck.allowed) {
    return res.status(403).json({
      error: "SKU limit reached"
    });
  }

  /*
  Registrar job
  */
  const job = createJob({
    title,
    description
  });

  /*
  Ejecutar transformación
  */
  const result = transformProduct({
    title,
    description
  });

  /*
  Guardar resultado en registry
  */
  productRegistry.saveProduct(job.id, result);

  res.json({
    jobId: job.id,
    status: "processed",
    result: result
  });

});

/*
GET endpoint solo para verificación
*/
app.get("/optimize/product", (req, res) => {
  res.json({
    engine: "ZEUS",
    endpoint: "/optimize/product",
    method: "POST",
    status: "active"
  });
});

/*
CONSULTAR JOB POR ID
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
LISTAR TODOS LOS JOBS
*/
app.get("/jobs", (req, res) => {

  const jobs = productRegistry.getAllProducts();

  res.json(jobs);

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("ZEUS CORE ENGINE RUNNING ON", PORT);
});