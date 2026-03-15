const Stripe = require("stripe");
const storeRegistry = require("../services/storeRegistry");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

const PLAN_LIMITS = {
  free: 50,
  starter: 500,
  growth: 2000,
  scale: 10000
};

const processedEvents = new Set();

function getSkuLimit(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

function getStoreCollection() {
  if (typeof storeRegistry.getAllStores === "function") {
    const all = storeRegistry.getAllStores();
    if (Array.isArray(all)) return all;
    if (all && typeof all === "object") return Object.values(all);
  }

  if (storeRegistry.stores && typeof storeRegistry.stores === "object") {
    return Object.values(storeRegistry.stores);
  }

  if (storeRegistry.registry && typeof storeRegistry.registry === "object") {
    return Object.values(storeRegistry.registry);
  }

  return [];
}

function resolveStoreFromRegistry({ store, stripeCustomer, stripeSubscription }) {
  if (store) return store;

  if (
    stripeSubscription &&
    typeof storeRegistry.findStoreByStripeSubscription === "function"
  ) {
    const found = storeRegistry.findStoreByStripeSubscription(stripeSubscription);
    if (found?.storeId) return found.storeId;
    if (found?.storeDomain) return found.storeDomain;
    if (typeof found === "string") return found;
  }

  if (
    stripeCustomer &&
    typeof storeRegistry.findStoreByStripeCustomer === "function"
  ) {
    const found = storeRegistry.findStoreByStripeCustomer(stripeCustomer);
    if (found?.storeId) return found.storeId;
    if (found?.storeDomain) return found.storeDomain;
    if (typeof found === "string") return found;
  }

  const stores = getStoreCollection();

  for (const item of stores) {
    const stripeInfo = item?.billing || item?.stripe || item?.subscription || {};

    const itemStore =
      item?.storeId ||
      item?.storeDomain ||
      item?.shopDomain ||
      item?.domain ||
      null;

    const itemCustomer =
      stripeInfo.customer ||
      stripeInfo.stripe_customer ||
      item?.stripe_customer ||
      item?.stripeCustomer ||
      null;

    const itemSubscription =
      stripeInfo.subscription ||
      stripeInfo.stripe_subscription ||
      item?.stripe_subscription ||
      item?.stripeSubscription ||
      null;

    if (stripeSubscription && itemSubscription === stripeSubscription) {
      return itemStore;
    }

    if (stripeCustomer && itemCustomer === stripeCustomer) {
      return itemStore;
    }
  }

  return null;
}

async function updateStorePlanSafe(store, payload) {
  if (!store) {
    throw new Error("store_not_resolved");
  }

  if (typeof storeRegistry.updateStorePlan !== "function") {
    throw new Error("storeRegistry.updateStorePlan_not_available");
  }

  await Promise.resolve(storeRegistry.updateStorePlan(store, payload));
}

async function handleCheckoutCompleted(session) {
  const store = resolveStoreFromRegistry({
    store: session.metadata?.store || session.client_reference_id || null,
    stripeCustomer: session.customer || null,
    stripeSubscription: session.subscription || null
  });

  const plan = session.metadata?.plan || "starter";

  await updateStorePlanSafe(store, {
    plan,
    sku_limit: getSkuLimit(plan),
    status: "active",
    stripe_customer: session.customer || null,
    stripe_subscription: session.subscription || null,
    stripe_checkout_session: session.id || null
  });

  console.log("STRIPE PLAN ACTIVATED:", store, plan);
}

async function handleSubscriptionUpdated(subscription) {
  const store = resolveStoreFromRegistry({
    store: subscription.metadata?.store || null,
    stripeCustomer: subscription.customer || null,
    stripeSubscription: subscription.id || null
  });

  const plan = subscription.metadata?.plan || undefined;

  const payload = {
    status: subscription.status,
    stripe_customer: subscription.customer || null,
    stripe_subscription: subscription.id || null
  };

  if (plan) {
    payload.plan = plan;
    payload.sku_limit = getSkuLimit(plan);
  }

  await updateStorePlanSafe(store, payload);

  console.log("STRIPE SUBSCRIPTION UPDATED:", store, subscription.status);
}

async function handleSubscriptionDeleted(subscription) {
  const store = resolveStoreFromRegistry({
    store: subscription.metadata?.store || null,
    stripeCustomer: subscription.customer || null,
    stripeSubscription: subscription.id || null
  });

  await updateStorePlanSafe(store, {
    plan: "free",
    sku_limit: getSkuLimit("free"),
    status: "inactive",
    stripe_customer: subscription.customer || null,
    stripe_subscription: null
  });

  console.log("STRIPE SUBSCRIPTION CANCELLED:", store);
}

async function handleInvoicePaymentFailed(invoice) {
  const store = resolveStoreFromRegistry({
    store: invoice.metadata?.store || null,
    stripeCustomer: invoice.customer || null,
    stripeSubscription: invoice.subscription || null
  });

  await updateStorePlanSafe(store, {
    status: "past_due",
    stripe_customer: invoice.customer || null,
    stripe_subscription: invoice.subscription || null
  });

  console.log("STRIPE PAYMENT FAILED:", store);
}

module.exports = async function stripeWebhookHandler(req, res) {
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

  if (processedEvents.has(event.id)) {
    return res.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        break;
    }

    processedEvents.add(event.id);

    if (processedEvents.size > 10000) {
      const iterator = processedEvents.values();
      for (let i = 0; i < 2000; i += 1) {
        const next = iterator.next();
        if (next.done) break;
        processedEvents.delete(next.value);
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("STRIPE WEBHOOK PROCESS ERROR:", error.message);
    return res.status(500).json({
      error: "stripe_webhook_processing_failed",
      message: error.message
    });
  }
};
