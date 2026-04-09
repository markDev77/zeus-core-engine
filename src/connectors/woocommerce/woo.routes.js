export async function handleWooWebhook(req, res) {
  try {
    const payload = req.body || {};

    // 🔥 STORE CONTEXT (FUENTE ÚNICA)
    const storeId =
      req.headers["x-store-id"] ||
      payload.storeId ||
      payload.store_id ||
      "woo-default";

    // 🔥 INYECTAR EN PAYLOAD ZEUS
    const zeusPayload = {
      ...payload,
      _context: {
        ...(payload._context || {}),
        storeId,
        platform: "woocommerce",
      },
    };

    // 🔴 FLUJO OFICIAL ZEUS (NO TOCAR)
    await processProductJob(zeusPayload);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("WOO WEBHOOK ERROR", err);
    return res.status(500).json({ ok: false });
  }
}
