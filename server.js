const express = require("express");

const { transformProduct } = require("./src/services/productTransformer");

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
  Llamamos al motor ZEUS
  */
  const result = transformProduct({
    title,
    description
  });

  res.json(result);

});

/*
GET endpoint solo para verificación en navegador
*/
app.get("/optimize/product", (req, res) => {
  res.json({
    engine: "ZEUS",
    endpoint: "/optimize/product",
    method: "POST",
    status: "active"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("ZEUS CORE ENGINE RUNNING ON", PORT);
});
