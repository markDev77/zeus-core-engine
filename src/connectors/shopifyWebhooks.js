const express = require("express");

const { processShopifyProduct } = require("./shopifyConnector");
const { checkZeusProcessed } = require("../security/loopProtection");

const router = express.Router();

/*
====================================================
UTIL
GET STORE FROM HEADERS
====================================================
*/

function getShopDomain(req) {

  return req.headers["x-shopify-shop-domain"];

}

/*
====================================================
SHOPIFY WEBHOOK
PRODUCT CREATED
====================================================
*/

router.post("/products/create", async (req, res) => {

  try {

    const payload = req.body;

    const shopDomain = getShopDomain(req);

    const productId = payload.id;

    console.log("SHOPIFY CREATE WEBHOOK");
    console.log("SHOP:", shopDomain);
    console.log("PRODUCT:", productId);

    /*
    ==========================================
    LOOP PROTECTION
    ==========================================
    */

    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const processed = await checkZeusProcessed(
      shopDomain,
      accessToken,
      productId
    );

    if (processed) {

      console.log("ZEUS LOOP BLOCKED", productId);

      return res.status(200).send("IGNORED");

    }

    /*
    ==========================================
    PROCESS PRODUCT
    ==========================================
    */

    const result = await processShopifyProduct({
      ...payload,
      shopDomain
    });

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

    const shopDomain = getShopDomain(req);

    const productId = payload.id;

    console.log("SHOPIFY UPDATE WEBHOOK");
    console.log("SHOP:", shopDomain);
    console.log("PRODUCT:", productId);

    /*
    ==========================================
    LOOP PROTECTION
    ==========================================
    */

    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    const processed = await checkZeusProcessed(
      shopDomain,
      accessToken,
      productId
    );

    if (processed) {

      console.log("ZEUS LOOP BLOCKED", productId);

      return res.status(200).send("IGNORED");

    }

    /*
    ==========================================
    PROCESS PRODUCT
    ==========================================
    */

    const result = await processShopifyProduct({
      ...payload,
      shopDomain
    });

    console.log("CONNECTOR RESULT:", result);

    res.status(200).send("OK");

  } catch (error) {

    console.error("WEBHOOK UPDATE ERROR:", error);

    res.status(500).send("ERROR");

  }

});

module.exports = router;
