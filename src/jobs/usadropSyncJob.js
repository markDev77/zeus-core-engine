const { getStore } = require("./storeService");

async function validateStoreAccess(shop) {
    try {
        const store = await getStore(shop);

        if (!store) {
            console.log("⛔ STORE NOT FOUND", shop);
            return { ok: false, reason: "STORE_NOT_FOUND" };
        }

        if (String(store.status).toLowerCase() !== "active") {
            console.log("⛔ BLOCKED - STORE INACTIVE", { shop, status: store.status });
            return { ok: false, reason: "INACTIVE" };
        }

        if (Number(store.tokens) <= 0) {
            console.log("⛔ BLOCKED - NO TOKENS", { shop, tokens: store.tokens });
            return { ok: false, reason: "NO_TOKENS" };
        }

        return { ok: true, store };

    } catch (err) {
        console.log("⛔ BLOCKED - STORE ERROR", { shop, error: err.message });
        return { ok: false, reason: "ERROR" };
    }
}

module.exports = {
    validateStoreAccess
};
