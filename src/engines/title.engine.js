// ZEUS TITLE ENGINE PRO (NO AI)
// Drop-in replacement - NO cambia firma

function buildFinalTitle({ aiTitle, originalTitle, language }) {
  try {
    if (!originalTitle) return "";

    const aiText =
      typeof aiTitle === "string"
        ? aiTitle
        : aiTitle?.title || "";

    // GO-TO-MARKET: IA manda
if (aiText && aiText.length > 10) {
  let title = aiText;

  // ==========================
  // 🔥 ZEUS HARDENING V3
  // ==========================

  // 1. NORMALIZAR ESPACIOS
  title = String(title || "")
    .replace(/\s+/g, " ")
    .trim();

  // 2. ELIMINAR BASURA COMÚN
  title = title
    .replace(/\b(1\s?(pieza|piece|pc|unit|set))\b/gi, "")
    .replace(/\b(producto|artículo|accesorio)\b/gi, "")
    .trim();

  // 3. EVITAR REPETICIÓN DE CONECTORES
  const connectors = ["para", "for", "pour", "für"];
  connectors.forEach(conn => {
    const regex = new RegExp(`(${conn}\\s+){2,}`, "gi");
    title = title.replace(regex, conn + " ");
  });

  // 4. ELIMINAR ADJETIVOS DÉBILES AISLADOS
  title = title.replace(/\b(moderno|practico|práctico|funcional|elegante)\b/gi, "");

  // 5. LIMPIEZA FINAL
  title = title
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-]+|[\s\-]+$/g, "")
    .trim();

  // 6. CONTROL DE LONGITUD (SMART TRIM)
  if (title.length > 110) {
    title = title.substring(0, 110).replace(/\s+\S*$/, "").trim();
  }

  // 7. CAPITALIZACIÓN FINAL
  title = fixCapitalization(title);

  return sanitize(title);
}

    // fallback
    return sanitize(capitalize(trimLength(originalTitle, 70)));

  } catch (err) {
    console.error("ZEUS TITLE ENGINE ERROR:", err);
    return originalTitle || "";
  }
}
// ---------------- HELPERS ----------------

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[\[\]\(\){}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removeNoise(text) {
  const noise = [
    "new", "fashion", "cool", "hot", "sale", "best", "2024", "2025",
    "free shipping", "dropshipping", "for sale", "cheap", "offer"
  ];

  let clean = text;

  noise.forEach(n => {
    const regex = new RegExp(`\\b${n}\\b`, "gi");
    clean = clean.replace(regex, "");
  });

  return clean.replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  return text.split(" ").filter(Boolean);
}

function dedupe(tokens) {
  return [...new Set(tokens)];
}

// 🔥 AQUÍ VA (JUSTO AQUÍ)
function detectProductEntity(text) {
  if (!text) return null;

  const normalized = text.toLowerCase();

  const entities = [
    "paint brush set",
    "brush set",
    "paint brushes",
    "drawing tablet",
    "graphic tablet",
    "wireless headphones",
    "smart watch",
    "notebook",
    "sketchbook",
    "cuaderno",
    "libro",
    "tablet grafica",
    "pinceles",
    "set de pinceles"
  ];

  for (let e of entities) {
    if (normalized.includes(e)) return e;
  }

  return null;
}

// 🔥 FIX: mejor clasificación (tipo producto real)
function classifyTokens(tokens) {
  const materials = ["steel", "leather", "cotton", "silicone", "plastic", "wood", "glass", "acero", "cuero", "algodon"];
  const colors = ["black", "white", "red", "blue", "green", "negro", "blanco", "rojo", "azul"];
  const functions = ["waterproof", "digital", "wireless", "smart", "recargable"];

  const productTypes = [
    "reloj", "watch",
    "libro", "book",
    "tablet", "pad",
    "laptop",
    "audifonos", "headphones",
    "camara", "camera",
    "soporte", "stand",
    "lampara", "lamp",
    "mochila", "backpack",
    "cuaderno", "notebook"
  ];

  let type = [];
  let attributes = [];
  let material = [];
  let color = [];

  tokens.forEach(t => {
    if (materials.includes(t)) material.push(t);
    else if (colors.includes(t)) color.push(t);
    else if (functions.includes(t)) attributes.push(t);
    else if (productTypes.includes(t)) type.push(t);
    else attributes.push(t); // fallback inteligente
  });

  return {
    type,
    attributes,
    material,
    color
  };
}

function buildStructuredTitle(parts, language) {
  const type = parts.type.slice(0, 2).join(" ");
  const attr = parts.attributes.slice(0, 3).join(" ");
  const material = parts.material.slice(0, 2).join(" ");
  const color = parts.color.slice(0, 1).join(" ");

  let segments = [];

  if (type) segments.push(type);
  if (attr) segments.push(attr);
  if (material) segments.push(material);
  if (color) segments.push(color);

  return segments.join(" ").trim();
}

function capitalize(text) {
  return text.replace(/\b\w/g, l => l.toUpperCase());
}

function sanitize(text) {
  return text
    .replace(/[%\-:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trimLength(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max).trim();
}

function fixCapitalization(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = {
  buildFinalTitle
};
