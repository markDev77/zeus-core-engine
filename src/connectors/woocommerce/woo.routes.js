const express = require("express");
const router = express.Router();

const { getProduct } = require("./woo.client");
const { mapWooToZeus, mapZeusToWoo } = require("./woo.mapper");
const { writeWooProduct } = require("./woo.writer");
const { generateAIContent } = require("../../engines/ai.engine");

router.post("/woocommerce/trigger-optimize", async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId required" });
    }

    const product = await getProduct(productId);

    const zeusInput = mapWooToZeus(product);

    const aiResult = await generateAIContent({
      title: zeusInput.input.title,
      description: zeusInput.input.description,
      language: "es"
    });

    const wooPayload = mapZeusToWoo({
      title: aiResult,
      description: zeusInput.input.description
    }, product);

    await writeWooProduct(productId, wooPayload);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ WOO OPT ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
