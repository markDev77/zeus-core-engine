const express = require("express");
const router = express.Router();

console.log("🔥 WOO ROUTES FILE LOADED");

const { getProduct } = require("./woo.client");
const { mapWooToZeus, mapZeusToWoo } = require("./woo.mapper");
const { writeWooProduct } = require("./woo.writer");
const { generateAIContent } = require("../../engines/ai.engine");

// ==========================
// TEST ROUTE (DEBUG)
// ==========================
router.get("/woocommerce/test", (req, res) => {
  return res.send("WOO ROUTES OK");
});

// ==========================
// MAIN ENDPOINT
// ==========================
router.post("/woocommerce/trigger-optimize", async (req, res) => {
  try {
    console.log("🚀 WOO TRIGGER HIT");

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId required" });
    }

    // 1. Leer producto
    const product = await getProduct(productId);

    console.log("📦 PRODUCT LOADED:", product.id);

    // 2. Mapear
    const zeusInput = mapWooToZeus(product);

    // 3. AI
    const aiResult = await generateAIContent({
      title: zeusInput.input.title,
      description: zeusInput.input.description,
      language: "es"
    });

    console.log("🤖 AI RESULT OK");

    // 4. Map regreso
    const wooPayload = mapZeusToWoo({
      title: aiResult,
      description: zeusInput.input.description
    }, product);

    console.log("📤 PAYLOAD READY");

    // 5. Write back
    await writeWooProduct(productId, wooPayload);

    console.log("✅ WOO UPDATED");

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ WOO OPT ERROR FULL:", err);
    return res.status(500).json({
      error: err.message || "unknown error"
    });
  }
});

module.exports = router;
