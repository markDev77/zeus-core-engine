/*
========================================
ZEUS SYNC ENGINE
========================================
Recibe producto optimizado
y sincroniza con ecommerce
========================================
*/

const { updateShopifyProduct } = require("./shopifySyncService");

async function syncProduct({

platform,
store,
product

}){

if(!platform) return;

if(platform==="shopify"){

if(!store) return;

const shopDomain = store.shopDomain;
const accessToken = store.accessToken;
const productId = store.productId;

if(!productId) return;

return updateShopifyProduct({

shopDomain,
accessToken,
productId,

title:product.title,
description:product.description,
tags:product.tags,
productType:product.regionalCategory || product.category

});

}

}

module.exports = {
syncProduct
};
