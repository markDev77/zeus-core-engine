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


// =======================================================
// 🔴 MODELO ANTIGUO (ZEUS → Woo) [NO USAR EN LTM]
// =======================================================
router.post("/woocommerce/trigger-optimize", async (req, res) => {
  try {
    console.log("🚀 WOO TRIGGER HIT");

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId required" });
    }

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


// =======================================================
// 🟢 MODELO NUEVO (Woo → ZEUS → Woo) ✔ ESTE ES EL BUENO
// =======================================================
router.post("/woocommerce/optimize-inline", async (req, res) => {
  try {
    console.log("🚀 WOO INLINE OPT HIT");

    const { title, description, language } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title required" });
    }

    console.log("📥 INPUT:", {
      title: title.slice(0, 60),
      hasDescription: !!description
    });

    const aiRaw = await generateAIContent({
      title,
      description,
      language: language || "es"
    });

    console.log("🤖 AI RAW:", typeof aiRaw);

    let finalTitle = title;
let finalDescription = description || "";

if (typeof aiRaw === "string") {
  finalTitle = aiRaw;

} else if (typeof aiRaw === "object" && aiRaw !== null) {
  finalTitle = aiRaw.title || title;
  finalDescription = aiRaw.description || description;
}

let finalTitle = title;
let finalDescription = description || "";

if (typeof aiRaw === "string") {
  finalTitle = aiRaw;

} else if (typeof aiRaw === "object" && aiRaw !== null) {
  finalTitle = aiRaw.title || title;
  finalDescription = aiRaw.description || description;
}

// limpieza básica
finalTitle = finalTitle.replace(/\s+/g, " ").trim();

const result = {
  title: finalTitle,
  description: finalDescription
};

    console.log("📤 RESULT READY");

    return res.json(result);

  } catch (err) {
    console.error("❌ INLINE OPT ERROR:", err.message);

    // 🔥 FALLBACK SEGURO (NUNCA ROMPE)
    return res.json({
      title: req.body.title,
      description: req.body.description || ""
    });
  }
});


// ==========================
// EXPORT
// ==========================
module.exports = router;
