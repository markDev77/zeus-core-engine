// /src/engines/pricing.engine.js

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

  return 8; // fallback
}

function roundPrice(price) {
  return Math.ceil(price / 10) * 10 - 1;
}

function calculateZeusPrice(usd, fxRate = 20) {
  if (!usd || usd <= 0) return 0;

  const markup = getMarkupByRange(usd);

  const adjustedUsd = usd + markup;

  const mxn = adjustedUsd * fxRate;

  return roundPrice(mxn);
}

module.exports = {
  calculateZeusPrice
};
