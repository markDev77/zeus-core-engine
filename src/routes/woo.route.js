// src/routes/woo.route.js

const express = require("express");
const router = express.Router();
const { enqueueJobDB } = require("../infra/queue/db-queue");

// ==========================
// CREATE / IMPORT PRODUCT
// ==========================
router.post("/woo/product", async (req, res) => {
  try {
    const { product, store } = req.body;

    if (!product) {
      return res.status(400).json({ error: "product is required" });
    }

    const jobPayload = {
      source: "woo",
      product,
      store: store || {
        platform: "woo",
        language: "es"
      }
    };

    await enqueueJobDB({
      shop: store?.shop || "woo-local",
      payload: jobPayload
    });

    console.log("📥 JOB ENQUEUED (WOO)", {
      productId: product.id
    });

    return res.json({
      success: true,
      message: "Product queued for ZEUS processing"
    });

  } catch (error) {
    console.error("❌ WOO ROUTE ERROR", error.message);

    return res.status(500).json({
      error: "internal_error"
    });
  }
});

module.exports = router;
