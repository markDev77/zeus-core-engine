const express = require("express");
const router = express.Router();

/* ========================================
   FIX: asegurar import correcto
======================================== */

// ❗ ESTE ES EL ERROR:
// processProduct ya no existe como función directa

// ❌ ELIMINAR si existe:
// const { processProduct } = require("../../core/processProduct");

// ✅ USAR ESTO:
const { processProductJob } = require("../../core/processProduct");


/* ========================================
   WEBHOOK WOO → ZEUS
======================================== */

router.post("/webhook/woo/product-update", async (req, res) => {
  try {
    const product = req.body;

    if (!product || !product.id) {
      console.log("⛔ INVALID WOO PAYLOAD");
      return res.status(400).send("invalid_payload");
    }

    console.log("🟢 WOO WEBHOOK RECEIVED", {
      productId: product.id
    });

    /* ========================================
       LLAMADA CORRECTA AL CORE
    ======================================== */

    await processProductJob({
      job: {
        shop: product?.meta_data?.find(m => m.key === "_zeus_store_id")?.value || "default",
        payload: {
          productId: product.id
        }
      },
      services: req.app.locals.services // ⚠️ usa servicios ya inyectados
    });

    return res.status(200).send("ok");

  } catch (error) {
    console.error("❌ WOO WEBHOOK ERROR", error.message);
    return res.status(500).send("error");
  }
});

module.exports = router;
