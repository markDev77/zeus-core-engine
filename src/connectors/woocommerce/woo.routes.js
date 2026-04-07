const express = require("express");

/* ========================================
   FIX CRÍTICO: handler explícito
======================================== */

async function wooProductUpdateHandler(req, res) {
  try {
    const product = req.body;

    if (!product || !product.id) {
      console.log("⛔ INVALID WOO PAYLOAD");
      return res.status(400).send("invalid_payload");
    }

    const { processProductJob } = require("../../core/processProduct");

    await processProductJob({
      job: {
        shop:
          (product.meta_data || []).find(m => m.key === "_zeus_store_id")?.value ||
          "default",
        payload: {
          productId: product.id
        }
      },
      services: req.app.locals.services
    });

    return res.status(200).send("ok");

  } catch (error) {
    console.error("❌ WOO WEBHOOK ERROR", error.message);
    return res.status(500).send("error");
  }
}

/* ========================================
   EXPORT DIRECTO (SIN router)
======================================== */

module.exports = {
  wooProductUpdateHandler
};
