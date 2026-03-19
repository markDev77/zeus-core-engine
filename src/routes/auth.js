const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const { registerStore } = require("../services/storeRegistry");

/*
AUTH CALLBACK
*/
router.get("/auth/callback", async (req, res) => {
  try {
    const { shop, code } = req.query;

    if (!shop || !code) {
      return res.status(400).send("Missing shop or code");
    }

    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("❌ NO ACCESS TOKEN:", tokenData);
      return res.status(500).send("OAuth failed");
    }

    const accessToken = tokenData.access_token;

    /*
    🔥 REGISTRO REAL (CLAVE)
    */
    await registerStore(shop, accessToken);

    console.log("🔥 STORE REGISTERED FROM AUTH:", shop);

    return res.redirect(`/activation?shop=${shop}`);

  } catch (error) {
    console.error("❌ AUTH CALLBACK ERROR:", error);
    return res.status(500).send("Auth error");
  }
});

module.exports = router;
