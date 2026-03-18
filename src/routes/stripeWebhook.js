const Stripe = require("stripe")
const storeRegistry = require("../services/storeRegistry")

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/*
====================================================
PLAN TOKENS (ZEUS)
====================================================
*/

const PLAN_TOKENS = {
  free: 20,
  starter: 300,
  growth: 1000,
  scale: 3000,
  powerful: 50000
}

function getTokens(plan) {
  return PLAN_TOKENS[plan] || PLAN_TOKENS.free
}

/*
====================================================
CHECKOUT COMPLETED (TOKENS MODE)
====================================================
*/

async function handleCheckoutCompleted(session) {

  const shopDomain = session.metadata?.shop
  const plan = session.metadata?.plan || "starter"

  if (!shopDomain) {
    console.error("❌ Missing shopDomain in metadata")
    return
  }

  const tokensToAdd = getTokens(plan)

  console.log("🔥 TOKENS PURCHASE:", shopDomain, plan, tokensToAdd)

  // 🔥 Obtener estado actual del store
  const store = await storeRegistry.getStore(shopDomain)

  const currentTokens = store?.tokens_balance || 0
  const newBalance = currentTokens + tokensToAdd

  console.log("💰 TOKENS BALANCE:", currentTokens, "+", tokensToAdd, "=", newBalance)

  await storeRegistry.updateStorePlan(shopDomain, {

    plan, // opcional mantener último plan comprado

    billing_status: "active",

    // 🔥 NUEVO MODELO
    tokens_balance: newBalance,

    // mantener compatibilidad
    sku_limit: tokensToAdd,

    stripe_customer: session.customer,

    last_payment_id: session.payment_intent,

    activatedAt: new Date().toISOString()
  })

  console.log("✅ TOKENS APPLIED:", shopDomain)
}

/*
====================================================
WEBHOOK
====================================================
*/

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
    console.error("❌ STRIPE SIGNATURE ERROR:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {

    console.log("📩 STRIPE EVENT:", event.type)

    switch (event.type) {

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object)
        break

      // 🔕 eventos legacy (no romper compatibilidad, pero no usados)
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.payment_failed":
        console.log("ℹ️ EVENT IGNORED (tokens mode):", event.type)
        break

      default:
        console.log("ℹ️ EVENT IGNORED:", event.type)
        break
    }

    res.json({ received: true })

  } catch (error) {

    console.error("❌ STRIPE WEBHOOK PROCESS ERROR:", error)

    res.status(500).json({
      error: "stripe_webhook_processing_failed"
    })
  }
}
