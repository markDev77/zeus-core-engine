const axios = require("axios");
const { isProcessed, markProcessed } = require("./webhookGuard");
const { logSync } = require("./syncLogger");

async function updateShopifyProduct(store, productId, optimizedProduct) {

    if (await isProcessed(productId)) {
        console.log("ZEUS LOOP PROTECTION: product already processed", productId);
        return;
    }

    const shop = store.shop;
    const accessToken = store.accessToken;

    const url = `https://${shop}/admin/api/2024-01/products/${productId}.json`;

    const payload = {
        product: {
            id: productId,
            title: optimizedProduct.optimizedTitle,
            body_html: optimizedProduct.description,
            tags: optimizedProduct.tags.join(", "),
            product_type: optimizedProduct.category
        }
    };

    try {

        const response = await axios.put(url, payload, {
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json"
            }
        });

        await markProcessed(productId);

        logSync({
            productId,
            shop,
            status: "updated"
        });

        console.log("ZEUS SYNC SUCCESS:", productId);

        return response.data;

    } catch (error) {

        logSync({
            productId,
            shop,
            status: "error",
            error: error.message
        });

        console.error("ZEUS SYNC ERROR:", error.message);

        throw error;
    }
}

module.exports = {
    updateShopifyProduct
};
