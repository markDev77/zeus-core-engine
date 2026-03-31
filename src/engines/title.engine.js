// ZEUS TITLE ENGINE PRO (NO AI)
// Drop-in replacement - NO cambia firma

function buildFinalTitle({ aiTitle, originalTitle, language }) {
  try {
    if (!originalTitle) return "";

    let title = normalize(originalTitle);

    // 1. Limpieza agresiva de ruido
    title = removeNoise(title);

    // 2. Tokenización
    let tokens = tokenize(title);

    // 3. Dedupe
    tokens = dedupe(tokens);

    // 4. Clasificación semántica simple (NO AI)
    const classified = classifyTokens(tokens);

    // 5. Construcción estructurada
    let finalTitle = buildStructuredTitle(classified, language);

    // 6. Capitalización
    finalTitle = capitalize(finalTitle, language);

    // 7. Sanitizar caracteres prohibidos
    finalTitle = sanitize(finalTitle);

    // 8. Limitar longitud (~70)
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

// Clasificación heurística (simple pero efectiva)
function classifyTokens(tokens) {
  const materials = ["steel", "leather", "cotton", "silicone", "plastic", "wood", "glass", "acero", "cuero", "algodon"];
  const colors = ["black", "white", "red", "blue", "green", "negro", "blanco", "rojo", "azul"];
  const functions = ["waterproof", "digital", "wireless", "smart", "recargable"];

  let type = [];
  let attributes = [];
  let material = [];
  let color = [];

  tokens.forEach(t => {
    if (materials.includes(t)) material.push(t);
    else if (colors.includes(t)) color.push(t);
    else if (functions.includes(t)) attributes.push(t);
    else type.push(t);
  });

  return {
    type,
    attributes,
    material,
    color
  };
}

function buildStructuredTitle(parts, language) {
  const type = parts.type.slice(0, 3).join(" ");
  const attr = parts.attributes.slice(0, 2).join(" ");
  const material = parts.material.slice(0, 2).join(" ");
  const color = parts.color.slice(0, 2).join(" ");

  let segments = [];

  if (type) segments.push(type);
  if (attr) segments.push(attr);
  if (material) segments.push(material);
  if (color) segments.push(color);

  return segments.join(" ").trim();
}

function capitalize(text, language) {
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
