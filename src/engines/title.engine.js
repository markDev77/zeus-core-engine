function normalize(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(text = "") {
  return text.replace(/\b\w/g, l => l.toUpperCase());
}

// 🔥 EXTRAER ATRIBUTOS CLAVE DEL HTML
function extractAttributes(description = "") {
  const text = normalize(description);

  const attributes = [];

  if (text.includes("quartz")) attributes.push("Cuarzo");
  if (text.includes("stainless")) attributes.push("Acero Inoxidable");
  if (text.includes("bluetooth")) attributes.push("Bluetooth");
  if (text.includes("sport")) attributes.push("Deportivo");
  if (text.includes("waterproof")) attributes.push("Resistente al Agua");

  return attributes;
}

// 🔥 EXTRAER COLOR
function extractVariant(variant = "") {
  if (!variant) return "";

  return capitalize(
    String(variant)
      .replace(/[^a-zA-Z\s]/g, "")
      .trim()
  );
}

// 🔥 LIMPIEZA FINAL
function cleanTitle(title = "") {
  return String(title)
    .replace(/[:\-–—,/|%&]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// 🔥 CORE
function buildFinalTitle({
  aiTitle = "",
  originalTitle = "",
  description = "",
  variant = ""
}) {

  const base = aiTitle || originalTitle;

  const cleanBase = normalize(base);

  let productName = "";

  if (cleanBase.includes("watch")) productName = "Reloj";
  else if (cleanBase.includes("grip")) productName = "Fortalecedor de Agarre";
  else productName = capitalize(base.split(" ").slice(0, 3).join(" "));

  const attributes = extractAttributes(description);
  const variantText = extractVariant(variant);

  const parts = [
    productName,
    ...attributes,
    variantText
  ].filter(Boolean);

  const finalTitle = capitalize(
    cleanTitle(parts.join(" "))
  );

  return finalTitle.slice(0, 140);
}

module.exports = {
  buildFinalTitle
};
