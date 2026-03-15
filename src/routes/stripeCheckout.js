const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/stripe/create-checkout", async (req, res) => {

  try {

    const { priceId, store } = req.body;

    const session = await stripe.checkout.sessions.create({

      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],

      metadata: {
        store: store
      },

      success_url: "https://zeusinfra.io/success",
      cancel_url: "https://zeusinfra.io/cancel"

    });

    res.json({
      checkoutUrl: session.url
    });

  } catch (error) {

    console.error("STRIPE CHECKOUT ERROR:", error);

    res.status(500).json({
      error: "checkout_failed"
    });

  }

});

module.exports = router;
