// ZEUS TITLE ENGINE PRO (NO AI)
// Drop-in replacement - NO cambia firma

function buildFinalTitle({ aiTitle, originalTitle, language }) {
  try {
    if (!originalTitle) return "";

    let title = normalize(originalTitle);

    // 🔥 Detectar entidad desde original
    let detectedEntity = detectProductEntity(title);

    // 🔥 EXTRA: usar IA para reforzar entidad (SIN depender)
    let aiText =
      typeof aiTitle === "string"
        ? aiTitle
        : aiTitle?.description || "";

    if (!detectedEntity && aiText) {
      const aiEntity = detectProductEntity(aiText.toLowerCase());
      if (aiEntity) detectedEntity = aiEntity;
    }

    // Limpieza normal
    title = removeNoise(title);

    let tokens = tokenize(title);
    tokens = dedupe(tokens);

    const classified = classifyTokens(tokens);

    let finalTitle = buildStructuredTitle(
      classified,
      language,
      detectedEntity
    );

    finalTitle = capitalize(finalTitle);
    finalTitle = sanitize(finalTitle);
    finalTitle = trimLength(finalTitle, 70);

    return finalTitle;

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

module.exports = {
  buildFinalTitle
};
