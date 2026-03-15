const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

/*
====================================================
VERIFY ENV
====================================================
*/

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY not configured");
  process.exit(1);
}

/*
====================================================
INIT STRIPE
====================================================
*/

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

/*
====================================================
CREATE CHECKOUT SESSION
====================================================
*/

router.post("/stripe/create-checkout", async (req, res) => {

  try {

    const { priceId, store } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: "missing_price_id"
      });
    }

    console.log("ZEUS STRIPE CHECKOUT START");
    console.log("PRICE:", priceId);
    console.log("STORE:", store);

    const session = await stripe.checkout.sessions.create({

      mode: "subscription",

      /*
      Allow ZEUS to identify the store
      */

      client_reference_id: store || "unknown",

      customer_creation: "always",

      payment_method_types: ["card"],

      billing_address_collection: "auto",

      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],

      metadata: {
        store: store || "unknown",
        source: "zeus"
      },

      /*
      Redirect URLs
      */

      success_url: "https://zeusinfra.io/success?session_id={CHECKOUT_SESSION_ID}",

      cancel_url: "https://zeusinfra.io/cancel",

      /*
      Optional but recommended
      */

      allow_promotion_codes: true

    });

    console.log("ZEUS STRIPE SESSION CREATED:", session.id);

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {

    console.error("STRIPE CHECKOUT ERROR:");

    console.error({
      message: error.message,
      type: error.type,
      code: error.code
    });

    return res.status(500).json({
      error: "stripe_checkout_failed",
      message: error.message
    });

  }

});

module.exports = router;
