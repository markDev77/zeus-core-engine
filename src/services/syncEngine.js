/*
========================================
ZEUS SYNC ENGINE
========================================
Recibe producto optimizado
y sincroniza con ecommerce
========================================
*/

async function syncProduct({

  platform,
  store,
  product

}){

  if(!platform) return;

  /*
  ========================================
  SHOPIFY
  ========================================
  */

  if(platform === "shopify"){

    if(!store) return;

    const { updateShopifyProduct } = require("./adapters/shopifyAdapter");

    const shopDomain = store.shopDomain || store.shop;
    const accessToken = store.accessToken;
    const productId = store.productId || product.id;

    if(!productId) return;

    return updateShopifyProduct(
      {
        shopDomain,
        accessToken
      },
      productId,
      {
        title: product.title,
        description: product.description,
        tags: product.tags,
        category: product.regionalCategory || product.category
      }
    );

  }

  /*
  ========================================
  WOOCOMMERCE (future)
  ========================================
  */

  if(platform === "woocommerce"){

    console.log("ZEUS WOOCOMMERCE SYNC NOT IMPLEMENTED");

    return null;

  }

  /*
  ========================================
  TIENDANUBE (future)
  ========================================
  */

  if(platform === "tiendanube"){

    console.log("ZEUS TIENDANUBE SYNC NOT IMPLEMENTED");

    return null;

  }

  /*
  ========================================
  UNKNOWN PLATFORM
  ========================================
  */

  console.log("ZEUS UNKNOWN PLATFORM:", platform);

  return null;

}

module.exports = {
  syncProduct
};
