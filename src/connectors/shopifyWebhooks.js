const express = require("express");

const { processShopifyProduct } = require("../connectors/shopifyConnector");

const router = express.Router();

/*
====================================================
SHOPIFY WEBHOOK
PRODUCT CREATED
====================================================
*/

router.post("/products/create", async (req, res) => {

  try {

    const payload = req.body;

    console.log("SHOPIFY CREATE WEBHOOK RECEIVED");
    console.log("PAYLOAD:", payload);

    const result = await processShopifyProduct(payload);

    console.log("CONNECTOR RESULT:", result);

    res.status(200).send("OK");

  } catch (error) {

    console.error("WEBHOOK CREATE ERROR:", error);

    res.status(500).send("ERROR");

  }

});

/*
====================================================
SHOPIFY WEBHOOK
PRODUCT UPDATED
====================================================
*/

router.post("/products/update", async (req, res) => {

  try {

    const payload = req.body;

    console.log("SHOPIFY UPDATE WEBHOOK RECEIVED");
    console.log("PAYLOAD:", payload);

    const result = await processShopifyProduct(payload);

    console.log("CONNECTOR RESULT:", result);

    res.status(200).send("OK");

  } catch (error) {

    console.error("WEBHOOK UPDATE ERROR:", error);

    res.status(500).send("ERROR");

  }

});

module.exports = router;