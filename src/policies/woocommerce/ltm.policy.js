/* ========================================
   LTM-MX POLICY (BASE - NO IMPACT)
   ZEUS Policy Layer
======================================== */

function ltmPolicy({ input, store, context }) {
  try {
    const storeId = store?.storeId || "unknown";

    /**
     * =========================
     * PASSTHROUGH (SIN IMPACTO)
     * =========================
     * No modifica nada del pipeline
     */
    const output = {
      ...input,

      _policy: {
        applied: "ltm-mx",
        storeId
      }
    };

    return output;

  } catch (err) {
    console.error("❌ LTM POLICY ERROR", err);

    return {
      ...input,
      _policy: {
        applied: "ltm-mx-error"
      }
    };
  }
}

module.exports = {
  ltmPolicy
};
