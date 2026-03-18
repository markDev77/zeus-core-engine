/*
========================================
SHOPIFY WEBHOOK ROUTES
========================================
*/

const express = require("express");

const { processShopifyProduct } = require("../connectors/shopifyConnector");

const router = express.Router();


router.post("/products/create", async (req, res) => {

  const payload = req.body;

  await processShopifyProduct(payload);

  res.status(200).send("OK");

});


router.post("/products/update", async (req, res) => {

  const payload = req.body;

  await processShopifyProduct(payload);

  res.status(200).send("OK");

});

module.exports = router;