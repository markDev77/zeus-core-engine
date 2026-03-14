const express = require("express");

const {
  normalizeShopDomain,
  generateState,
  generateInstallUrl,
  exchangeToken,
  verifyHmac
} = require("../auth/shopifyOAuth");

const { registerStore } = require("../services/storeRegistry");

const router = express.Router();

/*
Estado temporal OAuth
Luego se puede mover a Redis o DB
*/
const pendingStates = new Map();

/*
----------------------------------------
INSTALL ROUTE
----------------------------------------
GET /install?shop=store.myshopify.com
*/
router.get("/install", (req, res) => {

  try {

    const shop = normalizeShopDomain(req.query.shop);

    if (!shop) {
      return res.status(400).send("Invalid or missing shop parameter");
    }

    const state = generateState();

    pendingStates.set(shop, state);

    const installUrl = generateInstallUrl(shop, state);

    return res.redirect(installUrl);

  } catch (error) {

    console.error("INSTALL ERROR:", error);

    return res.status(500).send("INSTALL ERROR");

  }

});


/*
----------------------------------------
SHOPIFY OAUTH CALLBACK
----------------------------------------
GET /auth/callback
*/
router.get("/auth/callback", async (req, res) => {

  try {

    const { shop, code, state } = req.query;

    const safeShop = normalizeShopDomain(shop);

    if (!safeShop || !code || !state) {
      return res.status(400).send("Missing OAuth parameters");
    }

    /*
    Validate HMAC
    */

    const validHmac = verifyHmac(req.query);

    if (!validHmac) {
      return res.status(400).send("Invalid HMAC signature");
    }

    /*
    Validate state
    */

    const expectedState = pendingStates.get(safeShop);

    if (!expectedState || expectedState !== state) {
      return res.status(400).send("Invalid OAuth state");
    }

    /*
    Exchange code for access token
    */

    const tokenData = await exchangeToken(safeShop, code);

    const accessToken = tokenData.access_token;

    /*
    Register store inside ZEUS
    */

    registerStore(safeShop, accessToken);

    pendingStates.delete(safeShop);

    console.log("SHOPIFY STORE CONNECTED:", safeShop);

    return res.send(`
      <h2>ZEUS installed successfully</h2>
      <p>Store: ${safeShop}</p>
    `);

  } catch (error) {

    console.error("OAUTH ERROR:", error);

    return res.status(500).send(`OAuth Error: ${error.message}`);

  }

});

module.exports = router;