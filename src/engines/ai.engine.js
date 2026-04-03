const axios = require("axios");

// ==========================
// LANGUAGE HELPERS
// ==========================
function normalizeLanguage(lang) {
  if (!lang) return "en";

  return String(lang)
    .toLowerCase()
    .split("-")[0]
    .split("_")[0];
}

function getLanguageInstruction(language) {
  if (!language) {
    return "Write ALL output strictly in English.";
  }

  const lang = String(language).toLowerCase();

  if (lang.startsWith("es")) return "Responde TODO en español.";
  if (lang.startsWith("pt")) return "Responda TODO em português.";
  if (lang.startsWith("en")) return "Write ALL output strictly in English.";

  return `Write ALL output strictly in ${lang}. Do NOT use any other language.`;
}

// ==========================
// HELPERS
// ==========================
function safeJsonParse(raw) {
  try {
    const cleaned = String(raw || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (e) {
    console.log("AI JSON ERROR:", e.message);
    return null;
  }
}

function cleanArray(arr, limit = 6) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function cleanKeywordArray(arr, min = 8, max = 12) {
  if (!Array.isArray(arr)) return [];

  const seen = new Set();
  const out = [];

  for (const item of arr) {
    const clean = String(item || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(clean);

    if (out.length >= max) break;
  }

  return out.slice(0, Math.max(min, out.length));
}

function cleanCategoryHints(arr, limit = 3) {
  if (!Array.isArray(arr)) return [];

  const seen = new Set();
  const out = [];

  for (const item of arr) {
    const clean = String(item || "")
      .replace(/\s+/g, " ")
      .replace(/\s*>\s*/g, " > ")
      .trim();

    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(clean);

    if (out.length >= limit) break;
  }

  return out;
}

function cleanScalar(value, maxLen = 220) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function cleanIntent(intent) {
  if (!intent || typeof intent !== "object") {
    return {
      primary: "",
      secondary: "",
      purchase_driver: ""
    };
  }

  return {
    primary: cleanScalar(intent.primary, 120),
    secondary: cleanScalar(intent.secondary, 120),
    purchase_driver: cleanScalar(intent.purchase_driver, 140)
  };
}

function cleanFinalTitle(title = "") {
  return String(title)
    .replace(/[:\-–—,/|%&]+/g, " ")
    .replace(/\b(\w+)( \1\b)+/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-]+|[\s\-]+$/g, "")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .slice(0, 140)
    .trim();
}

function cleanStructuredTitleBase(title = "") {
  return String(title)
    .replace(/[:\-–—,/|%&]+/g, " ")
    .replace(/\b(\w+)( \1\b)+/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-]+|[\s\-]+$/g, "")
    .trim()
    .slice(0, 160);
}

function buildLegacyPrompt({ title, description, language }) {
  const langInstruction = getLanguageInstruction(language);

  return `
${langInstruction}

You are ZEUS, a senior ecommerce catalog optimizer.

INPUT
Raw title: ${title || ""}
Raw description: ${description || ""}

OBJECTIVE
Generate high-converting ecommerce content based ONLY on real data.

PRIORITY RULE
Always prioritize:
1. What the product is used for
2. Then what the product is
3. Then key attributes

CRITICAL RULES
- Do NOT invent attributes
- You CAN reorganize and prioritize information to improve purchase intent
- You MUST infer the main use case when obvious (e.g. fitness, drawing, office)
- Do NOT invent brand
- Do NOT invent specs
- Prioritize purchase intent
- Be clear in under 40 seconds

// 🔥 NUEVO — CONTROL DE CALIDAD
- Title must be fully rewritten, not a variation of the original
- Avoid repeating patterns like "para..." across products
- Avoid predictable or formulaic constructions
- Each product must feel unique and natural
- Do NOT concatenate phrases artificially
- Do NOT reuse the same sentence structure across outputs

STEP 1 — IDENTIFY PRODUCT
First determine clearly what the product is.
Example: "Drawing Pen", "Paint Brush Set", "Wireless Headphones"

STEP 2 — BUILD TITLE

TITLE STRUCTURE:
[Product Type] + [Key Attribute] + [Optional Functional Context]

RULES:
- Must sound like a real ecommerce product
- Max 70 characters
- No symbols
- No filler words (e.g. "best", "new", "hot")
- Must be natural, not robotic
- Avoid repetitive connectors (especially "para")
- Each title must vary in structure across products

STEP 3 — BUILD DESCRIPTION

STRUCTURE (MANDATORY):

1. intro (STORYTELLING)
- 3–4 FULL sentences (NOT short phrases)
- Must feel natural and human
- Avoid repetitive openings
- Must clearly describe:
  → context of use
  → benefit
  → why it matters
- Must integrate relevant keywords naturally
- Must NOT feel generic or templated

// 🔥 NUEVO — CONTROL DE PROFUNDIDAD
- Intro must NOT be short or superficial
- Must expand value perception of the product
- Must feel like real ecommerce copy

2. benefits (BENEFITS + USAGE AND FUNCTIONALITY)
- Section title translated to store language
- 3–5 bullet points
- Each bullet MUST explain:
  → what it does
  → how it is used
  → why it matters
- Vary sentence structure (no repetition)

3. specs (FEATURES / CHARACTERISTICS)
- Section title translated
- 3–6 real technical details
- Prefer "Key: Value" when possible

IMPORTANT:
- Write ALL content in the target language
- Keep structure consistent
- Avoid redundancy completely

OUTPUT FORMAT (CRITICAL):

<p>[intro]</p>

<h3>[Section title]</h3>
<ul>
<li>...</li>
</ul>

<h3>[Section title]</h3>
<ul>
<li>...</li>
</ul>

RULES:
- DO NOT repeat information
- DO NOT duplicate attributes
- Only 2 sections:
  1. Benefits / Usage
  2. Features / Specifications
- Clean, readable HTML

RETURN JSON:
{
  "title": "...",
  "intro": "...",
  "bullets": ["..."],
  "specs": ["..."],
  "trust": ["..."]
}
`;
}

function buildStructuredPrompt({ title, description, language, country, locale }) {
  const langInstruction = getLanguageInstruction(language);

  const normalizedCountry = String(country || "").trim().toUpperCase();
  const normalizedLocale = String(locale || "").trim().toLowerCase();

  return `
${langInstruction}

You are ZEUS, a senior ecommerce optimization intelligence engine.

TASK
Analyze the product and return ONLY valid JSON.
Do NOT return HTML.
Do NOT return markdown.
Do NOT add explanations.

INPUT
Raw title: ${title || ""}
Raw description: ${description || ""}
Target language: ${normalizeLanguage(language)}
Country context: ${normalizedCountry || "not_provided"}
Locale context: ${normalizedLocale || "not_provided"}

OBJECTIVE
Generate structured ecommerce intelligence optimized for:
1. SEO visibility
2. Conversational AI discoverability
3. Purchase intent
4. Real product clarity

CRITICAL RULES
- Use ONLY real information supported by the input
- Do NOT invent brand, specs, materials, guarantees or certifications
- Do NOT make false promises
- Do NOT use repetitive templates
- Benefits must sound natural and varied, not formulaic
- Adapt wording naturally to country/locale when relevant
- Keep the tone commercial, clear and credible
- If differentiator is not clear from the input, return an empty string
- Category hints must be taxonomic paths, top 3 maximum
- Keywords must be semantically strong, useful for search and conversational discovery
- Features should be concise factual statements, ideally "Key: Value"
- Intro should feel natural, persuasive and non-repetitive
- Intro should be around 5–7 lines max (natural ecommerce length)
- Benefits must explain value and usage with varied phrasing
- Avoid repeating sentence structures
- Return 8 to 12 keywords
- Return exactly 3 category hints when possible
- Write in the target language only

--------------------------------------
🧠 PURCHASE INTENT (CRITICAL)
--------------------------------------

The field "intent.purchase_driver" must:

• represent a REAL user need
• be specific and contextual
• be usable in a purchase decision
• NOT be generic or filler text

✅ VALID examples:
- "proteger los ojos del sol"
- "evitar el ingreso de insectos"
- "mejorar la seguridad del hogar"
- "organizar espacios pequeños"

❌ FORBIDDEN:
- "alta calidad"
- "uso diario"
- "en un solo producto"
- "diseño funcional"
- "gran estilo"
- "producto ideal"

--------------------------------------
✍️ WRITING STYLE
--------------------------------------

• Natural, human, non-template language
• Vary sentence structures
• Avoid predictable phrasing
• Do NOT start all sentences the same way
• Do NOT sound repetitive across outputs

--------------------------------------
📦 OUTPUT STRUCTURE (STRICT JSON)
--------------------------------------

{
  "title_base": "",
  "intro": "",
  "benefits": ["", "", ""],
  "features": ["", "", ""],
  "differentiator": "",
  "keywords": ["", "", "", "", "", "", "", ""],
  "category_hints": ["", "", ""],
  "intent": {
    "primary": "",
    "secondary": "",
    "purchase_driver": ""
  },
  "audience": "",
  "tone": ""
}
`;
}

async function callOpenAI(prompt) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      temperature: 0.15,
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    }
  );

  return response?.data?.choices?.[0]?.message?.content || "";
}

function normalizeLegacyOutput(parsed) {
  if (!parsed || !parsed.title || !parsed.intro) {
    return null;
  }

  const finalTitle = cleanFinalTitle(parsed.title);

  return {
    title: finalTitle,
    intro: String(parsed.intro || "").trim(),
    bullets: cleanArray(parsed.bullets, 6),
    specs: cleanArray(parsed.specs, 8),
    trust: cleanArray(parsed.trust, 3)
  };
}

function normalizeStructuredOutput(parsed, fallback = {}) {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const benefits = cleanArray(parsed.benefits, 6);
  const features = cleanArray(parsed.features, 8);
  const keywords = cleanKeywordArray(parsed.keywords, 8, 12);
  const categoryHints = cleanCategoryHints(parsed.category_hints, 3);

  const normalized = {
    title_base: cleanStructuredTitleBase(parsed.title_base || fallback.title || ""),
    intro: cleanScalar(parsed.intro, 900),
    benefits,
    features,
    differentiator: cleanScalar(parsed.differentiator, 220),
    keywords,
    category_hints: categoryHints,
    intent: cleanIntent(parsed.intent),
    audience: cleanScalar(parsed.audience, 140),
    tone: cleanScalar(parsed.tone, 80)
  };

  if (!normalized.title_base || !normalized.intro) {
    return null;
  }

  if (normalized.benefits.length < 3) {
    return null;
  }

  if (normalized.features.length < 3) {
    return null;
  }

  if (normalized.keywords.length < 8) {
    return null;
  }

  return normalized;
}

// ==========================
// 🔥 MAIN AI FUNCTION
// ==========================
async function generateAIContent({
  title,
  description,
  language,
  mode = "legacy",
  country = "",
  locale = ""
}) {
  try {
    const resolvedMode =
      String(mode || "legacy").toLowerCase() === "structured"
        ? "structured"
        : "legacy";

    const prompt =
      resolvedMode === "structured"
        ? buildStructuredPrompt({
            title,
            description,
            language,
            country,
            locale
          })
        : buildLegacyPrompt({
            title,
            description,
            language
          });

    const raw = await callOpenAI(prompt);
    const parsed = safeJsonParse(raw);

    if (resolvedMode === "structured") {
      const structured = normalizeStructuredOutput(parsed, {
        title
      });

      if (!structured) {
        console.log("AI STRUCTURED FALLBACK TRIGGERED");
        return null;
      }

      // ==========================
      // 🔥 STORYTELLING FIX (SOLO STRUCTURED)
      // ==========================
      if (structured.intro) {
        const intro = String(structured.intro).trim();
        const sentences = intro.split(/\. +/).filter(Boolean);

        if (sentences.length < 3) {
          const intent = structured.intent?.purchase_driver || "";

          const variations = [
            (intentValue) =>
              `Pensado para quienes buscan ${intentValue.toLowerCase()}, ofrece una solución práctica y funcional para el día a día.`,
            (intentValue) =>
              `Ideal para quienes valoran ${intentValue.toLowerCase()}, combinando comodidad con un diseño pensado para su uso continuo.`,
            (intentValue) =>
              `Diseñado para aportar ${intentValue.toLowerCase()}, facilitando su uso en diferentes situaciones cotidianas.`,
            (intentValue) =>
              `Una opción práctica para quienes necesitan ${intentValue.toLowerCase()}, destacando por su funcionalidad y facilidad de uso.`,
            (intentValue) =>
              `Perfecto si buscas ${intentValue.toLowerCase()}, integrando características que lo hacen útil en el uso diario.`,
            (intentValue) =>
              `Pensado para mejorar ${intentValue.toLowerCase()}, ofreciendo una experiencia cómoda y funcional.`,
            (intentValue) =>
              `Una solución funcional para quienes requieren ${intentValue.toLowerCase()}, adaptándose a distintas necesidades.`,
            (intentValue) =>
              `Diseñado para brindar ${intentValue.toLowerCase()}, con un enfoque práctico y fácil de usar.`,
            (intentValue) =>
              `Ideal para facilitar ${intentValue.toLowerCase()}, aportando funcionalidad sin complicaciones.`,
            () =>
              `Este producto destaca por su funcionalidad y un diseño pensado para facilitar su uso cotidiano.`
          ];

          const index = Math.floor(Math.random() * variations.length);
          const pick = variations[index];
          const extra = intent ? pick(intent) : pick();

          structured.intro = `${intro} ${extra}`.trim();
        }
      }

      return structured;
    }

    const legacy = normalizeLegacyOutput(parsed);

    if (!legacy) {
      console.log("AI LEGACY FALLBACK TRIGGERED");
      return null;
    }

    return legacy;
  } catch (err) {
    console.log("AI ENGINE ERROR:", err.message);
    return null;
  }
}

// ==========================
async function improveTitleWithAI({ title }) {
  return title;
}

module.exports = {
  generateAIContent,
  improveTitleWithAI,
  normalizeLanguage
};
