const express = require("express");
const router = express.Router();

const { stripe, PLANS } = require("../services/stripeService");
const storeRegistry = require("../services/storeRegistry");

router.post("/stripe/webhook", async (req, res) => {

  const sig = req.headers["stripe-signature"];

  let event;

  try {

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {

    console.error("Stripe webhook signature error");

    return res.status(400).send(`Webhook Error: ${err.message}`);

  }

  /*
  ====================================
  SUBSCRIPTION CREATED
  ====================================
  */

  if (event.type === "checkout.session.completed") {

    const session = event.data.object;

    const shop = session.metadata.shop;
    const plan = session.metadata.plan;

    const planConfig = PLANS[plan];

    await storeRegistry.updateStorePlan(shop, {
      plan: plan,
      sku_limit: planConfig.sku_limit
    });

    console.log("STRIPE PLAN ACTIVATED:", shop, plan);

  }

  /*
  ====================================
  SUBSCRIPTION CANCELED
  ====================================
  */

  if (event.type === "customer.subscription.deleted") {

    const subscription = event.data.object;

    const shop = subscription.metadata.shop;

    await storeRegistry.updateStorePlan(shop, {
      plan: "free",
      sku_limit: PLANS.free.sku_limit
    });

    console.log("STRIPE SUBSCRIPTION CANCELLED:", shop);

  }

  res.json({ received: true });

});

module.exports = router;