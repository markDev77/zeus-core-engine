const express = require("express");
const router = express.Router();

console.log("🔥 WOO ROUTES FILE LOADED");

const wooClient = require("./woo.client");
console.log("🔥 WOO CLIENT:", wooClient);

const { mapWooToZeus, mapZeusToWoo } = require("./woo.mapper");
const { writeWooProduct } = require("./woo.writer");
const { generateAIContent } = require("../../engines/ai.engine");
const { buildFinalDescription } = require("../../engines/description.engine");
const { buildTags } = require("../../engines/tags.engine");
const { resolveCategory } = require("../../engines/category.resolver");


// ==========================
// SAFE HELPERS
// ==========================
function normalizeLanguage(lang) {
  if (!lang) return "en";

  return String(lang)
    .toLowerCase()
    .split("-")[0]
    .split("_")[0];
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTitleFromStructured(aiResult, fallbackTitle = "") {
  try {
    if (!aiResult || typeof aiResult !== "object") {
      return cleanText(fallbackTitle);
    }

    const base = cleanText(aiResult.title_base || fallbackTitle);
    const intent = cleanText(aiResult.intent?.purchase_driver || "");
    const differentiator = cleanText(aiResult.differentiator || "");

    // ==========================
    // 🔹 CONSTRUCCIÓN NATURAL
    // ==========================
    let title = base;

    // ==========================
    // 🔹 DIFFERENTIATOR
    // ==========================
    if (
      differentiator &&
      differentiator.length > 8
    ) {
      const diffLower = differentiator.toLowerCase();

      if (!title.toLowerCase().includes(diffLower)) {
        title += " " + diffLower;
      }
    }

    // ==========================
    // 🔹 LIMPIEZA
    // ==========================
    title = title
      .replace(/[-–—]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // ==========================
    // 🔹 CAPITALIZACIÓN
    // ==========================
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // ==========================
    // 🔹 POLICY LENGTH
    // ==========================
    if (title.length > 110) {
      title = title.slice(0, 110).trim();
    }

    return title || cleanText(fallbackTitle);

  } catch (err) {
    console.error("ZEUS TITLE BUILD ERROR:", err);
    return cleanText(fallbackTitle);
  }
}
// ==========================
// TEST ROUTE
// ==========================
router.get("/woocommerce/test", (req, res) => {
  return res.send("WOO ROUTES OK");
});

// =======================================================
// 🔴 MODELO ANTIGUO (ZEUS → Woo) [LEGACY / NO PRIORIDAD]
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
      language: "es",
      mode: "legacy"
    });

    const aiResult = {
      title: typeof aiRaw === "string"
        ? aiRaw
        : (aiRaw?.title || zeusInput.input.title),
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
// 🟢 LTM MODELO NUEVO (Woo → ZEUS v2 → Woo)
// =======================================================
router.post("/woocommerce/optimize-inline", async (req, res) => {
  try {
    const requestId = Date.now();

    console.log("🚀 WOO INLINE OPT HIT", { requestId });

    const {
      title,
      description,
      language,
      country,
      locale,
      categories = []
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: "title required" });
    }

    const safeLanguage = normalizeLanguage(language || "es");

    console.log("📥 INPUT:", {
      requestId,
      title: String(title).slice(0, 80),
      hasDescription: !!description,
      language: safeLanguage,
      hasCategories: Array.isArray(categories) && categories.length > 0
    });

    // ==========================
    // 🧠 AI
    // ==========================
    const aiResult = await generateAIContent({
      title,
      description: description || "",
      language: safeLanguage,
      country: country || "",
      locale: locale || "",
      mode: "structured"
    });

    console.log("🧠 AI RESULT:", {
      requestId,
      ok: !!aiResult,
      hasTitleBase: !!aiResult?.title_base,
      benefits: aiResult?.benefits?.length || 0,
      features: aiResult?.features?.length || 0
    });

    // ==========================
    // ⚠️ FALLBACK
    // ==========================
    if (!aiResult) {
      console.log("⚠️ WOO STRUCTURED AI FALLBACK", { requestId });

      return res.json({
        ok: true,
        mode: "fallback",
        title: cleanText(title),
        description: description || "",
        tags: [],
        category: {
          best_match: null,
          alternatives: [],
          confidence: 0
        }
      });
    }

    // ==========================
    // ⚙️ ENGINES
    // ==========================
    const finalTitle = buildTitleFromStructured(aiResult, title);

    const finalDescription = buildFinalDescription({
  title: finalTitle,
  originalHtml: "", // 🔥 FORCE REPLACE MODE
  aiResult,
  language: safeLanguage
});

    const finalTags = buildTags({ aiResult });

    const categoryResult = resolveCategory({
      aiResult,
      categories: Array.isArray(categories) ? categories : [],
      mode: "adaptive",
      threshold: 1
    });

    console.log("⚙️ ENGINES:", {
      requestId,
      titleLength: finalTitle.length,
      tags: finalTags.length,
      hasCategory: !!categoryResult?.best_match
    });

    console.log("📤 RESULT READY:", {
      requestId,
      title: finalTitle.slice(0, 100),
      tags: finalTags.length,
      hasCategory: !!categoryResult?.best_match
    });

    // ==========================
    // 📤 RESPONSE (MISMO FORMATO)
    // ==========================
    return res.json({
      ok: true,
      mode: "structured",
      title: finalTitle,
      description: finalDescription,
      tags: finalTags,
      category: categoryResult,
      ai_meta: {
        audience: aiResult.audience || "",
        tone: aiResult.tone || "",
        intent: aiResult.intent || null,
        category_hints: aiResult.category_hints || []
      }
    });

  } catch (err) {
    console.error("❌ INLINE OPT ERROR:", {
      message: err.message,
      stack: err.stack
    });

    return res.json({
      ok: true,
      mode: "fallback",
      title: req.body?.title || "",
      description: req.body?.description || "",
      tags: [],
      category: {
        best_match: null,
        alternatives: [],
        confidence: 0
      }
    });
  }
});

// ==========================
// EXPORT
// ==========================
module.exports = router;
