const express = require("express")
const router = express.Router()

const {
  normalizeShopDomain,
  generateState,
  generateInstallUrl,
  exchangeToken,
  verifyHmac
} = require("../auth/shopifyOAuth")

const { registerStore } = require("../services/storeRegistry")
const registerWebhooks = require("../services/registerWebhooks")

/*
====================================================
INSTALL
====================================================
*/

router.get("/install", async (req, res) => {

  console.log("ZEUS INSTALL HIT:", req.query)

  const { shop } = req.query

  const safeShop = normalizeShopDomain(shop)

  if (!safeShop) {
    return res.status(400).send("Invalid shop")
  }

  const state = generateState()

  const installUrl = generateInstallUrl(safeShop, state)

  res.redirect(installUrl)

})

/*
====================================================
CALLBACK
====================================================
*/

router.get("/auth/callback", async (req, res) => {

  console.log("ZEUS CALLBACK HIT:", req.query)

  const { shop, code } = req.query

  const safeShop = normalizeShopDomain(shop)

  if (!safeShop) {
    return res.status(400).send("Invalid shop")
  }

  try {

    const tokenData = await exchangeToken(safeShop, code)

    console.log("ZEUS TOKEN DATA:", tokenData)

    const accessToken = tokenData.access_token

    console.log("ZEUS ACCESS TOKEN:", accessToken)

    console.log("ZEUS REGISTER STORE START:", safeShop)

    const store = await registerStore({
      shopDomain: safeShop,
      accessToken
    })

    console.log("ZEUS REGISTER STORE DONE:", store)

    console.log("ZEUS REGISTER WEBHOOKS START:", safeShop)

    await registerWebhooks({
      shopDomain: safeShop,
      accessToken
    })

    console.log("ZEUS REGISTER WEBHOOKS DONE:", safeShop)

    res.send("ZEUS INSTALLED SUCCESSFULLY")

  } catch (error) {

    console.error("ZEUS INSTALL ERROR:", error)

    res.status(500).send("Install failed")

  }

})

module.exports = router
