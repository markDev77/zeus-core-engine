// ==========================================
// ZEUS — WOO OPTIMIZE (PIPELINE INTEGRATION)
// ==========================================

const { resolveWooStoreContext } = require("./woo.store-resolver");
const { consumeToken } = require("../../services/storeService");

const { generateAIContent } = require("../../engines/ai.engine");
const { processProduct } = require("../../pipeline/processProduct");

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
       🔥 STORE CONTEXT
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
       🔥 HARD BLOCK
    ======================================== */

    if (!storeContext || balance <= 0) {
      console.log("⛔ HARD BLOCK - NO TOKENS", { shop, balance });

      return res.status(402).json({
        ok: false,
        error: "no_tokens_available"
      });
    }

    /* ========================================
       🔥 AI (SE MANTIENE AQUÍ)
    ======================================== */

    const aiResult = await generateAIContent({
      title: cleanTitle,
      description: cleanDescription,
      language: storeContext?.language || "es"
    });

    console.log("🔥 AI RESULT:", aiResult);

    /* ========================================
       🔥 PIPELINE ZEUS
    ======================================== */

    const pipelineResult = await processProduct({
      source: storeContext?.policy_key || "ltm-mx",
      product: {
        title: cleanTitle,
        description: cleanDescription,
        aiResult // 👈 lo pasamos para uso futuro
      },
      store: storeContext,
      policyContext: {
        trigger: "woo-optimize-endpoint"
      }
    });

    console.log("✅ ZEUS FINAL OUTPUT", {
      title: pipelineResult.title
    });

    /* ========================================
       🔥 TOKEN CONSUME
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

    /* ========================================
       🔥 RESPONSE (MISMO CONTRATO)
    ======================================== */

    return res.json({
      ok: true,
      requestId: null,
      output: {
        title: pipelineResult.title,
        description: pipelineResult.description_html,
        tags: pipelineResult.tags || []
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
