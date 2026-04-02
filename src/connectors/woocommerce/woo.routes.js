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
  if (!aiResult || typeof aiResult !== "object") {
    return cleanText(fallbackTitle);
  }

  const parts = [
    aiResult.title_base || "",
    aiResult.intent?.purchase_driver || "",
    aiResult.differentiator || ""
  ]
    .map(cleanText)
    .filter(Boolean);

  const seen = new Set();
  const unique = [];

  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }

  const finalTitle = unique.join(" - ").slice(0, 140).trim();

  return finalTitle || cleanText(fallbackTitle);
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
    console.log("🚀 WOO INLINE OPT HIT");

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
      title: String(title).slice(0, 80),
      hasDescription: !!description,
      language: safeLanguage,
      hasCategories: Array.isArray(categories) && categories.length > 0
    });

    const aiResult = await generateAIContent({
      title,
      description: description || "",
      language: safeLanguage,
      country: country || "",
      locale: locale || "",
      mode: "structured"
    });

    if (!aiResult) {
      console.log("⚠️ WOO STRUCTURED AI FALLBACK");
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

    const finalTitle = buildTitleFromStructured(aiResult, title);

    const finalDescription = buildFinalDescription({
      title: finalTitle,
      originalHtml: description || "",
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

    console.log("📤 RESULT READY:", {
      title: finalTitle.slice(0, 100),
      tags: finalTags.length,
      hasCategory: !!categoryResult?.best_match
    });

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
    console.error("❌ INLINE OPT ERROR:", err.message);

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
