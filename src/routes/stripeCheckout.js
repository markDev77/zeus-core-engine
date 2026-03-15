const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

/*
VALIDACIÓN DE VARIABLE DE ENTORNO
Esto evita que Stripe se inicialice con una key incorrecta
*/
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY not configured");
  process.exit(1);
}

/*
Inicialización segura de Stripe
*/
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});


/*
CREATE CHECKOUT SESSION
ZEUS SaaS Billing
*/
router.post("/stripe/create-checkout", async (req, res) => {

  try {

    const { priceId, store } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: "missing_price_id"
      });
    }

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
        store: store || "unknown"
      },

      success_url: "https://zeusinfra.io/success",
      cancel_url: "https://zeusinfra.io/cancel"

    });

    return res.json({
      checkoutUrl: session.url
    });

  } catch (error) {

    console.error("STRIPE CHECKOUT ERROR:", error);

    return res.status(500).json({
      error: "checkout_failed"
    });

  }

});

module.exports = router;
