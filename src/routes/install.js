const express = require("express");

const {
  normalizeShopDomain,
  generateState,
  generateInstallUrl,
  exchangeToken,
  verifyHmac
} = require("../auth/shopifyOAuth");

const { registerStore } = require("../services/storeRegistry");
const { getRegionProfile } = require("../data/regionProfiles");

const { registerWebhooks } = require("../services/shopifyWebhookRegistrar");

const router = express.Router();

const pendingStates = new Map();

function normalizePlatformCountry(rawCountry) {
  if (!rawCountry || typeof rawCountry !== "string") {
    return "US";
  }

  return rawCountry.trim().toUpperCase();
}

/*
----------------------------------------
INSTALL ROUTE
----------------------------------------
*/
router.get("/install", (req, res) => {
  try {

    const shop = normalizeShopDomain(req.query.shop);

    if (!shop) {
      return res.status(400).send("Invalid or missing shop parameter");
    }

    const state = generateState();

    pendingStates.set(shop, {
      state,
      profileSeed: {
        country: normalizePlatformCountry(req.query.country || "US"),
        language: req.query.language || null,
        currency: req.query.currency || null,
        marketplace: req.query.marketplace || "shopify",
        clientId: req.query.clientId || null,
        storeId: req.query.storeId || null
      }
    });

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
*/
router.get("/auth/callback", async (req, res) => {

  try {

    const { shop, code, state } = req.query;

    const safeShop = normalizeShopDomain(shop);

    if (!safeShop || !code || !state) {
      return res.status(400).send("Missing OAuth parameters");
    }

    const validHmac = verifyHmac(req.query);

    if (!validHmac) {
      return res.status(400).send("Invalid HMAC signature");
    }

    const pendingState = pendingStates.get(safeShop);

    if (!pendingState || pendingState.state !== state) {
      return res.status(400).send("Invalid OAuth state");
    }

    const tokenData = await exchangeToken(safeShop, code);
    const accessToken = tokenData.access_token;

    /*
    REGION PROFILE
    */
    let regionProfile = getRegionProfile(
      pendingState.profileSeed.country || "US"
    );

    if (!regionProfile) {

      console.log("ZEUS REGION PROFILE FALLBACK");

      regionProfile = {
        country: "US",
        language: "en",
        currency: "USD",
        marketplace: "shopify",
        catalogOrigin: "global",
        translationMode: "auto",
        marketSignalMode: "global",
        seoLocale: "en-US",
        titleStyle: "standard",
        descriptionStyle: "seo",
        tagStyle: "generic",
        categoryLocale: "global"
      };

    }

    /*
    REGISTER STORE
    */
    const store = registerStore(safeShop, accessToken, {

      storeId: pendingState.profileSeed.storeId || safeShop,
      clientId: pendingState.profileSeed.clientId || null,

      platform: "shopify",
      storeDomain: safeShop,

      country: regionProfile.country,
      language: pendingState.profileSeed.language || regionProfile.language,
      currency: pendingState.profileSeed.currency || regionProfile.currency,
      marketplace: pendingState.profileSeed.marketplace || regionProfile.marketplace,

      catalogOrigin: regionProfile.catalogOrigin,
      translationMode: regionProfile.translationMode,
      marketSignalMode: regionProfile.marketSignalMode,
      seoLocale: regionProfile.seoLocale,

      titleStyle: regionProfile.titleStyle,
      descriptionStyle: regionProfile.descriptionStyle,
      tagStyle: regionProfile.tagStyle,
      categoryLocale: regionProfile.categoryLocale

    });

    await registerWebhooks(safeShop, accessToken);

    pendingStates.delete(safeShop);

    console.log("SHOPIFY STORE CONNECTED:", safeShop);

    const profile = store?.profile || regionProfile;

    return res.send(`
      <h2>ZEUS installed successfully</h2>
      <p>Store: ${safeShop}</p>
      <p>Store ID: ${store.storeId}</p>
      <p>Country: ${profile.country}</p>
      <p>Language: ${profile.language}</p>
      <p>Currency: ${profile.currency}</p>
    `);

  } catch (error) {

    console.error("OAUTH ERROR:", error);
    return res.status(500).send(`OAuth Error: ${error.message}`);

  }

});

module.exports = router;
