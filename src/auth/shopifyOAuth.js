const crypto = require("crypto");
const fetch = require("node-fetch");

/*
====================================================
SHOPIFY ENV VARIABLES
====================================================
*/

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_API_KEY;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_REDIRECT_URI = `${process.env.SHOPIFY_APP_URL}/auth/callback`;

const SHOPIFY_SCOPES =
  process.env.SHOPIFY_SCOPES ||
  "read_products,write_products,read_inventory,write_inventory";

/*
====================================================
NORMALIZE SHOP DOMAIN
====================================================
*/

function normalizeShopDomain(shop) {

  if (!shop) return null;

  const normalized = String(shop).trim().toLowerCase();

  const regex = /^[a-z0-9][a-z0-9\-]*\.myshopify\.com$/;

  if (!regex.test(normalized)) {
    return null;
  }

  return normalized;

}

/*
====================================================
GENERATE STATE
====================================================
*/

function generateState() {

  return crypto.randomBytes(16).toString("hex");

}

/*
====================================================
GENERATE INSTALL URL
====================================================
*/

function generateInstallUrl(shop, state) {

  const params = new URLSearchParams({

    client_id: SHOPIFY_CLIENT_ID,
    scope: SHOPIFY_SCOPES,
    redirect_uri: SHOPIFY_REDIRECT_URI,
    state

  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;

}

/*
====================================================
TOKEN EXCHANGE
====================================================
*/

async function exchangeToken(shop, code) {

  const response = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
      data.error ||
      "Shopify token exchange failed"
    );
  }

  if (!data.access_token) {
    throw new Error("Shopify did not return access_token");
  }

  return data;

}

/*
====================================================
VERIFY HMAC
====================================================
*/

function verifyHmac(query) {

  const { hmac, signature, ...rest } = query;

  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map(key => {

      const value = Array.isArray(rest[key])
        ? rest[key].join(",")
        : rest[key];

      return `${key}=${value}`;

    })
    .join("&");

  const generatedHash = crypto
    .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmac)
  );

}

/*
====================================================
EXPORTS
====================================================
*/

module.exports = {

  normalizeShopDomain,
  generateState,
  generateInstallUrl,
  exchangeToken,
  verifyHmac

};