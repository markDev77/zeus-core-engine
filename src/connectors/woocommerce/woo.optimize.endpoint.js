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

    const tokens = storeContext?.tokens || 0;
    const tokensUsed = storeContext?.tokens_used || 0;
    const balance = tokens - tokensUsed;

    console.log("🧠 ZEUS STORE CONTEXT (OPTIMIZE)", {
      shop,
      tokens,
      tokens_used: tokensUsed,
      balance
    });

    /* ========================================
       🔥 HARD BLOCK (REAL BALANCE)
    ======================================== */

    if (!storeContext || balance <= 0) {
      console.log("⛔ HARD BLOCK - NO TOKENS", { shop, balance });

      return res.status(402).json({
        ok: false,
        error: "no_tokens_available"
      });
    }

    // ==========================================
    // 🔥 AI REAL (1 SOLA LLAMADA)
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

    /* ========================================
       🔥 TOKEN CONSUME (POST SUCCESS - ZEUS STYLE)
    ======================================== */

    if (shop) {
      try {
        await consumeToken(shop);

        console.log("💰 TOKEN CONSUMED", { shop });

      } catch (err) {

        if (err.message === "NO TOKENS AVAILABLE") {
          console.warn("⛔ TOKEN LIMIT REACHED (post)", { shop });
        } else {
          console.warn("⚠️ TOKEN CONSUME ERROR", {
            shop,
            error: err.message
          });
        }
      }
    }

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
