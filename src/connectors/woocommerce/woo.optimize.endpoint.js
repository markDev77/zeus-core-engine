// ==========================================
// ZEUS — WOO OPTIMIZE (FORCED AI ENGINE)
// ==========================================

const { resolveWooStoreContext } = require("./woo.store-resolver");
const { consumeToken } = require("../../services/storeService");

const { generateAIContent } = require("../../engines/ai.engine");
const { buildFinalTitle } = require("../../engines/title.engine");
const { buildFinalDescription } = require("../../engines/description.engine");

async function handleWooOptimize(req, res) {
  try {
    const { input } = req.body;

    if (!input || !input.title) {
      return res.status(400).json({
        ok: false,
        error: "invalid_input"
      });
    }

    const cleanTitle = input.title;
    const cleanDescription = input.description || "";

    console.log("🟣 ZEUS WOO OPTIMIZE REQUEST", {
      title: cleanTitle
    });

    /* ========================================
       🔥 STORE CONTEXT (DB REAL)
    ======================================== */

    const storeContext = await resolveWooStoreContext(req);

    const shop = storeContext?.baseUrl;

    console.log("🧠 ZEUS STORE CONTEXT (OPTIMIZE)", {
      shop,
      tokens: storeContext?.tokens,
      tokens_used: storeContext?.tokens_used
    });

    /* ========================================
       🔥 TOKEN CONTROL (NO ROMPE FLUJO)
    ======================================== */

    if (shop) {
      const tokenResult = await consumeToken(shop);

      if (!tokenResult?.success) {
        console.log("⛔ TOKEN BLOCK", { shop });

        return res.status(402).json({
          ok: false,
          error: "token_limit_reached"
        });
      }

      console.log("💰 TOKEN CONSUMED", { shop });
    }

    // ==========================================
    // 🔥 AI REAL (SIN PIPELINE INTERMEDIO)
    // ==========================================
    const aiResult = await generateAIContent({
      title: cleanTitle,
      description: cleanDescription,
      language: "es"
    });

    console.log("🔥 AI RESULT:", aiResult);

    // ==========================================
    // 🔥 TITLE ENGINE
    // ==========================================
    const finalTitle = buildFinalTitle({
      aiTitle: aiResult,
      originalTitle: cleanTitle,
      description: cleanDescription
    });

    // ==========================================
    // 🔥 DESCRIPTION ENGINE
    // ==========================================
    const finalDescription = buildFinalDescription({
      title: finalTitle,
      originalHtml: cleanDescription,
      aiResult,
      language: "es"
    });

    console.log("✅ ZEUS FINAL OUTPUT", {
      finalTitle
    });

    return res.json({
      ok: true,
      requestId: null,
      output: {
        title: finalTitle,
        description: finalDescription,
        tags: [finalTitle]
      }
    });

  } catch (err) {
    console.error("❌ WOO OPTIMIZE ERROR", err);

    return res.status(500).json({
      ok: false,
      error: "internal_error"
    });
  }
}

module.exports = {
  handleWooOptimize
};
