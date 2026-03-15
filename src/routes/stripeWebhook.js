const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

const storeRegistry = require("../services/storeRegistry");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

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

    console.error("STRIPE SIGNATURE ERROR:", err.message);

    return res.status(400).send(`Webhook Error: ${err.message}`);

  }

  /*
  ====================================
  CHECKOUT COMPLETED
  ====================================
  */

  if (event.type === "checkout.session.completed") {

    const session = event.data.object;

    const shop = session.metadata?.store || session.client_reference_id;
    const plan = session.metadata?.plan || "starter";

    const PLAN_LIMITS = {
      free: 50,
      starter: 500,
      growth: 2000,
      scale: 10000
    };

    const sku_limit = PLAN_LIMITS[plan] || 500;

    storeRegistry.updateStorePlan(shop, {
      plan: plan,
      sku_limit: sku_limit,
      status: "active",
      stripe_customer: session.customer,
      stripe_subscription: session.subscription
    });

    console.log("STRIPE PLAN ACTIVATED:", shop, plan);

  }

  /*
  ====================================
  SUBSCRIPTION UPDATED
  ====================================
  */

  if (event.type === "customer.subscription.updated") {

    const subscription = event.data.object;

    const shop = subscription.metadata?.store;

    if (shop) {

      storeRegistry.updateStorePlan(shop, {
        status: subscription.status,
        stripe_subscription: subscription.id
      });

      console.log("STRIPE SUBSCRIPTION UPDATED:", shop, subscription.status);

    }

  }

  /*
  ====================================
  SUBSCRIPTION DELETED
  ====================================
  */

  if (event.type === "customer.subscription.deleted") {

    const subscription = event.data.object;

    const shop = subscription.metadata?.store;

    if (shop) {

      storeRegistry.updateStorePlan(shop, {
        plan: "free",
        sku_limit: 50,
        status: "inactive",
        stripe_subscription: null
      });

      console.log("STRIPE SUBSCRIPTION CANCELLED:", shop);

    }

  }

  /*
  ====================================
  PAYMENT FAILED
  ====================================
  */

  if (event.type === "invoice.payment_failed") {

    const invoice = event.data.object;

    const shop = invoice.metadata?.store;

    if (shop) {

      storeRegistry.updateStorePlan(shop, {
        status: "past_due"
      });

      console.log("STRIPE PAYMENT FAILED:", shop);

    }

  }

  res.json({ received: true });

});

module.exports = router;
