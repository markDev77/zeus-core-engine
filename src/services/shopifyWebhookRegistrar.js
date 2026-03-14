const fetch = require("node-fetch");

/*
====================================================
REGISTER SHOPIFY WEBHOOKS
====================================================
*/

async function registerWebhooks(shop, accessToken) {

  const webhooks = [

    {
      topic: "products/create",
      address: `${process.env.SHOPIFY_APP_URL}/webhooks/products-create`
    },

    {
      topic: "products/update",
      address: `${process.env.SHOPIFY_APP_URL}/webhooks/products-update`
    },

    {
      topic: "inventory_levels/update",
      address: `${process.env.SHOPIFY_APP_URL}/webhooks/inventory-update`
    }

  ];

  for (const webhook of webhooks) {

    try {

      const response = await fetch(
        `https://${shop}/admin/api/2024-01/webhooks.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            webhook: {
              topic: webhook.topic,
              address: webhook.address,
              format: "json"
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("WEBHOOK REGISTER FAILED:", data);
      } else {
        console.log("WEBHOOK REGISTERED:", webhook.topic);
      }

    } catch (error) {

      console.error("WEBHOOK ERROR:", error);

    }

  }

}

module.exports = {
  registerWebhooks
};
