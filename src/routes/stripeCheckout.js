const express = require("express")
const router = express.Router()
const Stripe = require("stripe")

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post("/stripe/create-checkout", async (req, res) => {

  try {

    const { priceId, shop, plan } = req.body

    if (!priceId) {
      return res.status(400).json({ error: "missing_price_id" })
    }

    if (!shop) {
      return res.status(400).json({ error: "missing_shop" })
    }

    const safePlan = plan || "starter"

    const session = await stripe.checkout.sessions.create({

      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],

      client_reference_id: shop,

      metadata: {
        shop,
        plan: safePlan,
        source: "zeus"
      },

      subscription_data: {
        metadata: {
          shop,
          plan: safePlan,
          source: "zeus"
        }
      },

      success_url:
        "https://zeusinfra.io/success?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        "https://zeusinfra.io/cancel"

    })

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    })

  } catch (error) {

    console.error("STRIPE CHECKOUT ERROR:", error)

    res.status(500).json({
      error: "stripe_checkout_failed",
      message: error.message
    })

  }

})

module.exports = router
