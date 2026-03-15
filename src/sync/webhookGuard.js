const processedProducts = new Set();

async function isProcessed(productId) {

    return processedProducts.has(productId);

}

async function markProcessed(productId) {

    processedProducts.add(productId);

    setTimeout(() => {
        processedProducts.delete(productId);
    }, 300000);

}

module.exports = {
    isProcessed,
    markProcessed
};
