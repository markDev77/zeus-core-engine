const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  free: {
    sku_limit: 20
  },
  starter: {
    sku_limit: 500
  },
  growth: {
    sku_limit: 2000
  },
  scale: {
    sku_limit: 10000
  },
  unlimited: {
    sku_limit: 999999
  }
};

async function createCheckoutSession(plan, store) {

  if (!PLANS[plan]) {
    throw new Error("Invalid plan");
  }

  const session = await stripe.checkout.sessions.create({

    payment_method_types: ["card"],

    mode: "subscription",

    line_items: [
      {
        price: process.env[`STRIPE_PRICE_${plan.toUpperCase()}`],
        quantity: 1
      }
    ],

    success_url: `${process.env.APP_URL}/install?shop=${store}`,

    cancel_url: `${process.env.APP_URL}/billing-cancel`,

    metadata: {
      shop: store,
      plan: plan
    }

  });

  return session;

}

module.exports = {
  stripe,
  createCheckoutSession,
  PLANS
};