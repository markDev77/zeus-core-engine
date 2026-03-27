// /src/engines/category.engine.v2.js

const cheerio = require("cheerio");
const { resolveCategoryPro } = require("./category.brain.pro");

// ==========================
// NORMALIZATION
// ==========================
function stripHtml(html = "") {
  try {
    return cheerio.load(html || "", { decodeEntities: false }).text();
  } catch (_) {
    return String(html || "");
  }
}

function normalizeText(text = "") {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.%/+-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLanguage(language = "") {
  return String(language || "es")
    .toLowerCase()
    .split("-")[0]
    .split("_")[0];
}

function buildCorpus({ title, description }) {
  const plainDescription = stripHtml(description || "");
  return normalizeText(`${title || ""} ${plainDescription}`);
}

// ==========================
// ATTRIBUTE EXTRACTION
// ==========================
function extractMaterial(text) {
  const materials = [
    "abs",
    "pvc",
    "pla",
    "silicone",
    "metal",
    "plastic",
    "polyester",
    "wood",
    "acrylic",
    "glass",
    "ceramic",
    "stainless steel",
    "aluminum",
    "algodon",
    "acero inoxidable",
    "plastico",
    "madera",
    "vidrio",
    "ceramica"
  ];

  for (const mat of materials) {
    const needle = normalizeText(mat);
    if (text.includes(needle)) return mat;
  }

  return null;
}

function extractCapacity(text) {
  const patterns = [
    /\b(\d+)\s*(ml|l|litros|liters|hojas|sheets|toallas|pcs|pieces|kg)\b/i,
    /\bcapacidad\s*(de)?\s*(\d+)\s*(ml|l|hojas|kg)\b/i,
    /\bload\s*(capacity)?\s*(\d+)\s*(kg|lb)\b/i
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      return m.slice(1).filter(Boolean).join(" ").trim();
    }
  }

  return null;
}

function extractSize(text) {
  const patterns = [
    /\b\d{1,4}\s*[x×]\s*\d{1,4}\s*[x×]?\s*\d{0,4}\s*(cm|mm|m)?\b/i,
    /\b\d{1,4}\s*(cm|mm|m)\b/i
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].trim();
  }

  return null;
}

function extractBattery(text) {
  const m = text.match(/\b(\d{3,6}\s*mah)\b/i);
  return m ? m[1].trim() : null;
}

function extractVoltage(text) {
  const m = text.match(/\b(\d+(?:\.\d+)?)\s*v\b/i);
  return m ? `${m[1]}V` : null;
}

function extractColor(title = "") {
  const colors = [
    "black", "white", "blue", "red", "green", "yellow", "pink", "gray", "grey", "brown", "purple", "orange",
    "negro", "blanco", "azul", "rojo", "verde", "amarillo", "rosa", "gris", "cafe", "morado", "naranja",
    "humo", "ivory", "ivory white"
  ];

  const t = normalizeText(title);
  for (const color of colors) {
    const needle = normalizeText(color);
    if (t.includes(needle)) return color;
  }

  return null;
}

function extractAttributes({ title, text }) {
  const attributes = {};

  const material = extractMaterial(text);
  const capacity = extractCapacity(text);
  const size = extractSize(text);
  const battery = extractBattery(text);
  const voltage = extractVoltage(text);
  const color = extractColor(title);

  if (material) attributes.material = material;
  if (capacity) attributes.capacity = capacity;
  if (size) attributes.size = size;
  if (battery) attributes.battery = battery;
  if (voltage) attributes.voltage = voltage;
  if (color) attributes.color = color;

  return attributes;
}

// ==========================
// INTENT RULES
// ==========================
const RULES = [
  {
    id: "pool_float",
    whenAny: [
      "inflatable",
      "swimming ring",
      "float",
      "floating",
      "lifesaving ring",
      "pool float",
      "flotador",
      "inflable",
      "anillo inflable"
    ],
    domain: "Deportes y Aire Libre",
    category: "Accesorios de piscina",
    subcategory: "Flotadores",
    type: "Flotador inflable",
    use_case: "recreacion acuatica"
  },
  {
    id: "night_light",
    whenAny: [
      "night light",
      "led lamp",
      "dragon night light",
      "luz nocturna",
      "lampara led",
      "lampara decorativa"
    ],
    domain: "Hogar",
    category: "Iluminacion",
    subcategory: "Lamparas decorativas",
    type: "Luz nocturna LED",
    use_case: "ambientacion"
  },
  {
    id: "car_sticker",
    whenAny: [
      "car door anti collision sticker",
      "anti collision sticker",
      "car sticker",
      "sticker",
      "calcomania automotriz",
      "protector de puerta"
    ],
    domain: "Automotriz",
    category: "Accesorios exteriores",
    subcategory: "Protectores y molduras",
    type: "Protector adhesivo automotriz",
    use_case: "proteccion estetica"
  },
  {
    id: "dispensers",
    whenAny: [
      "dispensador",
      "dispenser",
      "paper towel dispenser",
      "toalla interdoblada",
      "interfold towel",
      "soap dispenser"
    ],
    domain: "Higiene y Limpieza",
    category: "Limpieza",
    subcategory: "Dispensadores",
    type: "Dispensador",
    use_case: "higiene institucional"
  },
  {
    id: "toys",
    whenAny: [
      "toy",
      "toys",
      "montessori",
      "educational toy",
      "smart toys",
      "juguete",
      "juguetes"
    ],
    domain: "Juguetes y Entretenimiento",
    category: "Juguetes",
    subcategory: "Juguetes educativos",
    type: "Juguete educativo",
    use_case: "aprendizaje y entretenimiento"
  },
  {
    id: "lighting_generic",
    whenAny: [
      "lamp",
      "light",
      "led",
      "lighting",
      "lampara",
      "luz",
      "iluminacion"
    ],
    domain: "Hogar",
    category: "Iluminacion",
    subcategory: "Iluminacion decorativa",
    type: "Lampara",
    use_case: "iluminacion"
  },
  {
    id: "cleaning_generic",
    whenAny: [
      "cleaning",
      "limpieza",
      "sanitizer",
      "sanitizante",
      "desinfectante",
      "disinfection"
    ],
    domain: "Higiene y Limpieza",
    category: "Limpieza",
    subcategory: "Sanitizantes",
    type: "Producto de limpieza",
    use_case: "higiene"
  }
];

// ==========================
// SCORING
// ==========================
function scoreRule(text, rule) {
  let score = 0;
  for (const token of rule.whenAny || []) {
    if (text.includes(normalizeText(token))) score += 1;
  }
  return score;
}

function resolveBestRule(text) {
  let best = null;
  let bestScore = 0;

  for (const rule of RULES) {
    const score = scoreRule(text, rule);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }

  return { best, bestScore };
}

function computeConfidence(score, attrCount) {
  let confidence = 0.35;

  if (score >= 1) confidence += 0.2;
  if (score >= 2) confidence += 0.2;
  if (score >= 3) confidence += 0.1;
  if (attrCount >= 1) confidence += 0.05;
  if (attrCount >= 2) confidence += 0.05;
  if (attrCount >= 3) confidence += 0.05;

  return Math.min(Number(confidence.toFixed(2)), 0.98);
}

// ==========================
// FALLBACK
// ==========================
function buildFallbackIntent(attributes = {}) {
  return {
    domain: "General",
    category: "General",
    subcategory: "Sin clasificar",
    type: "Producto general",
    attributes,
    use_case: "general",
    confidence: 0.3
  };
}

// ==========================
// PUBLIC API
// ==========================
function resolveIntent({ title = "", description = "", language = "es", vendor = "" }) {
  const lang = normalizeLanguage(language);
  const corpus = buildCorpus({ title, description });
  const attributes = extractAttributes({ title, text: corpus });
  const { best, bestScore } = resolveBestRule(corpus);
  // 🔥 CATEGORY PRO
const pro = resolveCategoryPro({
  title,
  description
});

if (pro) {
  return {
    domain: pro.domain,
    category: pro.category,
    subcategory: pro.subcategory,
    type: pro.type,
    attributes,
    use_case: "pro_detected",
    confidence: pro.confidence || 0.8,
    language: lang,
    source_vendor: vendor || null
  };
}
  
  // 🔥 CATEGORY PRO (OVERRIDE INTELIGENTE)


  if (!best) {
    return buildFallbackIntent(attributes);
  }

  return {
    domain: best.domain,
    category: best.category,
    subcategory: best.subcategory,
    type: best.type,
    attributes,
    use_case: best.use_case,
    confidence: computeConfidence(bestScore, Object.keys(attributes).length),
    language: lang,
    source_vendor: vendor || null
  };
}

function buildCategoryPath(intent) {
  if (!intent) return "General > General > Sin clasificar > Producto general";

  return [
    intent.domain || "General",
    intent.category || "General",
    intent.subcategory || "Sin clasificar",
    intent.type || "Producto general"
  ].join(" > ");
}

module.exports = {
  resolveIntent,
  buildCategoryPath
};
