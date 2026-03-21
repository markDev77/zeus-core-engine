const API_BASE = "https://zeus-core-engine.onrender.com";

export async function fetchStoreData(shop) {
  const endpoints = [
    `/api/store/status`,
    `/api/store`,
    `/store/status`,
    `/store`,
    `/api/dashboard`,
    `/dashboard`
  ];

  let lastError = null;

  for (const path of endpoints) {
    try {
      const res = await fetch(`${API_BASE}${path}?shop=${encodeURIComponent(shop)}`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      return normalize(json);

    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("No endpoint respondió");
}

function normalize(raw) {
  return {
    availableTokens:
      raw.availableTokens ??
      raw.tokens_available ??
      raw.tokens ??
      0,

    usedTokens:
      raw.usedTokens ??
      raw.tokens_used ??
      0,

    plan:
      raw.plan ??
      raw.plan_name ??
      "Free",

    status:
      raw.status ??
      "active"
  };
}
