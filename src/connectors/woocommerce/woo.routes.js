const express = require("express");
const router = express.Router();

console.log("🔥 WOO ROUTES FILE LOADED");

// 🔥 IMPORT DIRECTO Y VERIFICADO
const wooClient = require("./woo.client");
console.log("🔥 WOO CLIENT:", wooClient);

const { mapWooToZeus, mapZeusToWoo } = require("./woo.mapper");
const { writeWooProduct } = require("./woo.writer");
const { generateAIContent } = require("../../engines/ai.engine");

// ==========================
// TEST ROUTE
// ==========================
router.get("/woocommerce/test", (req, res) => {
  return res.send("WOO ROUTES OK");
});

// ==========================
// MAIN
// ==========================
router.post("/woocommerce/trigger-optimize", async (req, res) => {
  try {
    console.log("🚀 WOO TRIGGER HIT");

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId required" });
    }

    // 🔥 LLAMADA DIRECTA (SIN DESTRUCTURING)
    const product = await wooClient.getProduct(productId);

    console.log("📦 PRODUCT FULL:", product);

    const zeusInput = mapWooToZeus(product);

    const aiRaw = await generateAIContent({
      title: zeusInput.input.title,
      description: zeusInput.input.description,
      language: "es"
    });

    const aiResult = {
      title: typeof aiRaw === "string" ? aiRaw : zeusInput.input.title,
      description: zeusInput.input.description
    };

    const wooPayload = mapZeusToWoo(aiResult, product);

    await writeWooProduct(productId, wooPayload);

    console.log("✅ WOO UPDATED");

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ WOO OPT ERROR FULL:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
