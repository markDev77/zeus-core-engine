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

// 🔥 LIMPIADOR FINAL DE TÍTULO LEGACY (CRÍTICO)
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

// 🔥 LIMPIADOR BASE TITLE STRUCTURED
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

STEP 1 — IDENTIFY PRODUCT
First determine clearly what the product is.
Example: "Drawing Pen", "Paint Brush Set", "Wireless Headphones"

STEP 2 — BUILD TITLE
TITLE STRUCTURE:
[Product Type] + [1–2 Key Attributes] + [Optional Detail]

RULES:
- Must sound like a real ecommerce product
- Max 70 characters
- No symbols
- No filler words (e.g. "best", "new", "hot")

STEP 3 — BUILD DESCRIPTION

STRUCTURE (MANDATORY):

1. intro (STORYTELLING)
- 3–4 sentences
- Start naturally, DO NOT always use the same opening phrase
- Avoid repetitive patterns like "Imagina", "Imagine", "Stell dir vor"
- Vary the introduction across products
- Must describe how the product improves the user's situation
- Must include relevant keywords naturally integrated
- Must include 6–10 relevant SEO keywords naturally integrated

2. benefits (BENEFITS + USAGE AND FUNCTIONALITY)
- Use a section title translated to the store language (e.g. Benefits / Beneficios / Vorteile)
- 3–5 bullet points
- Each bullet MUST explain:
  → what it does
  → how it is used
  → why it matters

3. specs (FEATURES / CHARACTERISTICS)
- Use a section title translated to the store language (e.g. Features / Características / Eigenschaften)
- 3–6 real technical details

IMPORTANT:
- Write ALL content in the target language
- Do NOT use English unless the language is English
- Keep structure consistent across all languages

OUTPUT FORMAT (CRITICAL):
The description MUST be structured in clean HTML.
Structure EXACTLY like this:
<p>[intro]</p>

<h3>[Section title translated to store language]</h3>
<ul>
<li>...</li>
</ul>

<h3>[Section title translated to store language]</h3>
<ul>
<li>...</li>
</ul>

RULES:
- DO NOT repeat information already present in the raw description
- DO NOT duplicate specs, materials, or attributes already provided
- Avoid redundancy completely
- Use ONLY 2 sections:
  1. Benefits / Usage
  2. Features / Specifications
- Section titles MUST be in the store language
- Keep bullets concise and non-repetitive

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
- Features should be expressed as concise factual statements, ideally "Key: Value" when possible
- Intro should feel natural, persuasive and non-repetitive
- Intro should be around 4 lines max in normal ecommerce length
- Benefits must explain value and usage naturally, but with varied sentence structures
- Avoid starting all bullets the same way
- Return 8 to 12 keywords
- Return exactly 3 category hints when possible
- Write in the target language only

RETURN JSON WITH THIS EXACT SHAPE:
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

    // 🔥 VARIACIONES CONTROLADAS
    const variations = [
      (intent) => `Pensado para quienes buscan ${intent.toLowerCase()}, ofrece una solución práctica y funcional para el día a día.`,
      (intent) => `Ideal para quienes valoran ${intent.toLowerCase()}, combinando comodidad con un diseño pensado para su uso continuo.`,
      (intent) => `Diseñado para aportar ${intent.toLowerCase()}, facilitando su uso en diferentes situaciones cotidianas.`,
      (intent) => `Una opción práctica para quienes necesitan ${intent.toLowerCase()}, destacando por su funcionalidad y facilidad de uso.`,
      (intent) => `Perfecto si buscas ${intent.toLowerCase()}, integrando características que lo hacen útil en el uso diario.`,
      (intent) => `Pensado para mejorar ${intent.toLowerCase()}, ofreciendo una experiencia cómoda y funcional.`,
      (intent) => `Una solución funcional para quienes requieren ${intent.toLowerCase()}, adaptándose a distintas necesidades.`,
      (intent) => `Diseñado para brindar ${intent.toLowerCase()}, con un enfoque práctico y fácil de usar.`,
      (intent) => `Ideal para facilitar ${intent.toLowerCase()}, aportando funcionalidad sin complicaciones.`,
      () => `Este producto destaca por su funcionalidad y un diseño pensado para facilitar su uso cotidiano.`
    ];

    // 🔥 ALEATORIEDAD CONTROLADA
    const index = Math.floor(Math.random() * variations.length);
    const pick = variations[index];

    const extra = intent ? pick(intent) : pick();

    structured.intro = (intro + " " + extra).trim();
  }
}

return structured;

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
