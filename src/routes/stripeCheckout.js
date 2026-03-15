const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY not configured");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

router.post("/stripe/create-checkout", async (req, res) => {
  try {
    const { priceId, store, plan } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: "missing_price_id"
      });
    }

    if (!store) {
      return res.status(400).json({
        error: "missing_store"
      });
    }

    const safePlan = plan || "starter";

    console.log("================================================");
    console.log("ZEUS STRIPE CHECKOUT START");
    console.log("PRICE:", priceId);
    console.log("STORE:", store);
    console.log("PLAN:", safePlan);
    console.log("================================================");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],

      client_reference_id: store,

      metadata: {
        store,
        plan: safePlan,
        source: "zeus"
      },

      subscription_data: {
        metadata: {
          store,
          plan: safePlan,
          source: "zeus"
        }
      },

      success_url:
        "https://zeusinfra.io/success?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        "https://zeusinfra.io/cancel"
    });

    console.log("ZEUS STRIPE SESSION CREATED:", session.id);

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error("================================================");
    console.error("STRIPE CHECKOUT ERROR");
    console.error("MESSAGE:", error.message);
    console.error("TYPE:", error.type);
    console.error("CODE:", error.code);
    console.error("================================================");

    return res.status(500).json({
      error: "stripe_checkout_failed",
      message: error.message
    });
  }
});

module.exports = router;
