const Stripe = require("stripe")
const storeRegistry = require("../services/storeRegistry")

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLAN_LIMITS = {

  free: 50,
  starter: 500,
  growth: 2000,
  scale: 10000

}

function getLimit(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter
}

async function handleCheckoutCompleted(session) {

  const shop =
    session.metadata?.shop ||
    session.client_reference_id

  const plan =
    session.metadata?.plan ||
    "starter"

  if (!shop) return

  await storeRegistry.updateStorePlan(shop, {

    plan,
    status: "active",
    sku_limit: getLimit(plan),
    stripe_customer: session.customer,
    stripe_subscription: session.subscription,
    activatedAt: new Date().toISOString()

  })

  console.log("ZEUS PLAN ACTIVATED:", shop, plan)

}

async function handleSubscriptionUpdated(subscription) {

  const shop =
    subscription.metadata?.shop

  if (!shop) return

  await storeRegistry.updateStorePlan(shop, {

    status: subscription.status,
    stripe_customer: subscription.customer,
    stripe_subscription: subscription.id

  })

  console.log("ZEUS SUBSCRIPTION UPDATED:", shop)

}

async function handleSubscriptionDeleted(subscription) {

  const shop =
    subscription.metadata?.shop

  if (!shop) return

  await storeRegistry.updateStorePlan(shop, {

    plan: "free",
    status: "inactive",
    sku_limit: PLAN_LIMITS.free,
    stripe_subscription: null

  })

  console.log("ZEUS SUBSCRIPTION CANCELLED:", shop)

}

async function handleInvoiceFailed(invoice) {

  const shop =
    invoice.metadata?.shop

  if (!shop) return

  await storeRegistry.updateStorePlan(shop, {

    status: "past_due"

  })

  console.log("ZEUS PAYMENT FAILED:", shop)

}

module.exports = async function stripeWebhook(req, res) {

  const sig = req.headers["stripe-signature"]

  let event

  try {

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )

  } catch (err) {

    console.error("STRIPE SIGNATURE ERROR:", err.message)

    return res.status(400).send(`Webhook Error: ${err.message}`)

  }

  try {

    switch (event.type) {

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break

      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object)
        break

      default:
        break

    }

    res.json({ received: true })

  } catch (error) {

    console.error("STRIPE WEBHOOK PROCESS ERROR:", error)

    res.status(500).json({
      error: "stripe_webhook_processing_failed"
    })

  }

}
