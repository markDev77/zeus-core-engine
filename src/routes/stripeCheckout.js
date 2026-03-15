const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

/*
Verificar variable de entorno
*/
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY not configured");
  process.exit(1);
}

/*
Inicializar Stripe
*/
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

/*
Crear sesión de checkout
*/
router.post("/stripe/create-checkout", async (req, res) => {

  try {

    const { priceId, store } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: "missing_price_id"
      });
    }

    console.log("Creating Stripe Checkout for price:", priceId);

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

    console.log("Stripe session created:", session.id);

    return res.json({
      checkoutUrl: session.url
    });

  } catch (error) {

    console.error("STRIPE CHECKOUT ERROR:", error);

    /*
    Devolver error real para diagnóstico
    */
    return res.status(500).json({
      message: error.message,
      type: error.type,
      code: error.code,
      raw: error.raw
    });

  }

});

module.exports = router;
