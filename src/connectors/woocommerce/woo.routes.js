const express = require("express");
const router = express.Router();

const { processProduct } = require("../../core/processProduct");
const { buildWooWriteHash } = require("./woo.writer");

/* ========================================
   NORMALIZAR TAGS
======================================== */
function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];

  return [...new Set(
    tags
      .map((tag) => {
        if (!tag) return null;
        if (typeof tag === "string") return tag.trim();
        if (typeof tag === "object" && tag.name) return String(tag.name).trim();
        return null;
      })
      .filter(Boolean)
  )];
}

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

    const incomingHash = buildWooWriteHash({
      name: product.name || "",
      description: product.description || "",
      short_description: product.short_description || "",
      tags: normalizeTags(product.tags || [])
    });

    const zeusHashMeta = (product.meta_data || []).find(
      (m) => m.key === "_zeus_last_write_hash"
    );

    const zeusHash = zeusHashMeta ? zeusHashMeta.value : null;

    /* ========================================
       LOOP PROTECTION
    ======================================== */
    if (zeusHash && zeusHash === incomingHash) {
      console.log("🔁 LOOP BLOCKED (ZEUS WRITE DETECTED)", {
        productId: product.id
      });

      return res.status(200).send("loop_blocked");
    }

    console.log("🟢 WOO WEBHOOK → PROCESS", {
      productId: product.id
    });

    await processProduct({
      source: "woocommerce",
      product
    });

    return res.status(200).send("ok");

  } catch (error) {
    console.error("❌ WOO WEBHOOK ERROR", error.message);
    return res.status(500).send("error");
  }
});

module.exports = router;
