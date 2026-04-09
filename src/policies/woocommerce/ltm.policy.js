/* ========================================
   LTM-MX POLICY (BASE - NO IMPACT)
   ZEUS Policy Layer
======================================== */

function ltmPolicy({ product, store, context }) {
  try {
    // 🔥 STORE CONTEXT
    const storeId = store?.storeId || "unknown";

    // 👉 DEBUG CONTROLADO (NO RUIDO)
    // console.log("LTM POLICY EXEC", { storeId });

    /* ========================================
       BASE RESPONSE (NO MODIFICA NADA)
    ======================================== */

    return {
      product,        // passthrough
      meta: {
        policy: "ltm-mx",
        storeId
      }
    };

  } catch (err) {
    console.error("❌ LTM POLICY ERROR", err);

    return {
      product,
      meta: {
        policy: "ltm-mx-error"
      }
    };
  }
}

module.exports = {
  ltmPolicy
};
