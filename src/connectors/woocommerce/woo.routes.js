const { resolveWooStoreContext } = require("./woo.store-resolver");
const { processProductJob } = require("../../jobs/processProductJob");

export async function handleWooWebhook(req, res) {
  try {
    const payload = req.body || {};

    /* ========================================
       🔥 STORE CONTEXT (ZEUS REAL - DB)
    ======================================== */

    const storeContext = await resolveWooStoreContext(req);

    const storeId =
      storeContext?.storeId ||
      req.headers["x-store-id"] ||
      payload.storeId ||
      payload.store_id ||
      "woo-default";

    /* ========================================
       🔥 INYECTAR CONTEXTO ZEUS
    ======================================== */

    const zeusPayload = {
      ...payload,
      _context: {
        ...(payload._context || {}),
        storeId,
        platform: "woocommerce",

        // 🔥 CONTEXTO REAL (NO ROMPE)
        tokens: storeContext?.tokens || null,
        tokens_used: storeContext?.tokens_used || null,
        tokens_balance: storeContext?.tokens_balance || null,
        status: storeContext?.status || "active"
      },
    };

    /* ========================================
       🔴 FLUJO OFICIAL ZEUS (NO TOCAR)
    ======================================== */

    await processProductJob(zeusPayload);

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("WOO WEBHOOK ERROR", err);
    return res.status(500).json({ ok: false });
  }
}
