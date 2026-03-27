// src/policies/Shopify/usadrop.policy.js

function getMarkupByRange(usd) {
  if (usd <= 12) return 5;
  if (usd <= 18) return 6;
  if (usd <= 24) return 5;
  if (usd <= 33) return 7;
  if (usd <= 40) return 6;
  if (usd <= 45) return 5;
  if (usd <= 53) return 7;
  if (usd <= 60) return 5;
  if (usd <= 67) return 6;
  if (usd <= 78) return 6;
  if (usd <= 89) return 7;
  if (usd <= 100) return 7;

  return 8;
}

// ==========================
// 🔥 PRICING
// ==========================
function resolvePricing({ usd }) {
  const base = Number(usd || 0);

  if (!base || base <= 0) {
    return 0;
  }

  const markup = getMarkupByRange(base);

  const finalPrice = base + markup;

  // 🔥 asegurar formato Shopify (string decimal)
  return Number(finalPrice.toFixed(2));
}

// ==========================
// 🔥 INVENTORY
// ==========================
function resolveInventory() {
  return 11;
}

// ==========================
// 🔥 EXPORT
// ==========================
module.exports = {
  name: "usadrop",

  // flags (compatibles con tu engine actual)
  pricing: true,
  fallback_price: true,
  inventory_fixed: true,
  weight_fixed: true,
  description_mode: "hybrid",

  resolvePricing,
  resolveInventory
};
