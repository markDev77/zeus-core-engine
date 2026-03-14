/*
========================================
ZEUS SHOPIFY SYNC SERVICE
========================================
Actualiza productos en Shopify
con datos optimizados por ZEUS
========================================
*/

const fetch = require("node-fetch");

async function updateShopifyProduct({
shopDomain,
accessToken,
productId,
title,
description,
tags,
productType
}) {

if (!shopDomain || !accessToken || !productId) {
throw new Error("Missing Shopify credentials for sync");
}

const url = `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`;

const payload = {
product: {
id: productId,
title: title,
body_html: description,
tags: tags.join(", "),
product_type: productType
}
};

const response = await fetch(url,{
method:"PUT",
headers:{
"Content-Type":"application/json",
"X-Shopify-Access-Token":accessToken
},
body:JSON.stringify(payload)
});

if(!response.ok){
const text = await response.text();
throw new Error(`Shopify sync failed: ${text}`);
}

return response.json();
}

module.exports = {
updateShopifyProduct
};
