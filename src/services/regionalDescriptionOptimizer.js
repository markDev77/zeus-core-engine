/*
========================================
ZEUS REGIONAL DESCRIPTION OPTIMIZER v3
LONG SEO DESCRIPTION HTML
========================================
Mantiene compatibilidad con pipeline
y mejora estructura SEO ecommerce.
========================================
*/

function normalizeWhitespace(text = "") {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(text = "") {
  const clean = normalizeWhitespace(text);
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function detectFeatures(source = "") {

  const features = [];

  if (source.includes("recargable") || source.includes("rechargeable"))
    features.push("Batería recargable de larga duración");

  if (source.includes("inalámbrico") || source.includes("wireless"))
    features.push("Tecnología inalámbrica para mayor comodidad");

  if (source.includes("eléctrico") || source.includes("electric"))
    features.push("Sistema eficiente diseñado para alto rendimiento");

  if (source.includes("control remoto") || source.includes("remote"))
    features.push("Incluye control remoto para operación sencilla");

  if (source.includes("portable"))
    features.push("Diseño portátil fácil de transportar");

  if (source.includes("waterproof") || source.includes("impermeable"))
    features.push("Construcción resistente al agua");

  if (source.includes("led"))
    features.push("Indicadores LED de estado");

  return features;
}

function buildSpanishDescription({ title = "", description = "", category = "general" }) {

  let html = "";

  html += `<h2>${capitalize(title)}</h2>`;

  html += `<p>${description || title}</p>`;

  return html;
}

  html += `</ul>`;

  html += `<h3>Características del producto</h3>`;
  html += `<ul>`;
  html += `<li>Materiales seleccionados para mayor durabilidad</li>`;
  html += `<li>Diseño optimizado para practicidad</li>`;
  html += `<li>Configuración sencilla para el usuario</li>`;
  html += `</ul>`;

  html += `<h3>Cómo utilizar este producto</h3>`;
  html += `<p>${capitalize(title)} puede utilizarse fácilmente siguiendo las prácticas comunes para su categoría. Su diseño facilita la adopción tanto para usuarios nuevos como experimentados.</p>`;

  if (category === "pet_supplies") {

    html += `<h3>Uso recomendado</h3>`;
    html += `<p>Ideal para mejorar rutinas de entrenamiento, control de comportamiento y actividades diarias con mascotas.</p>`;

  }

  html += `<h3>Ideal para</h3>`;
  html += `<p>Usuarios que buscan una solución práctica, funcional y confiable dentro de esta categoría de productos.</p>`;

  return normalizeWhitespace(html);
}

function buildEnglishDescription({ title = "", description = "", category = "general" }) {

  const source = `${title} ${description}`.toLowerCase();
  const features = detectFeatures(source);

  let html = "";

  html += `<h2>${capitalize(title)}</h2>`;

  html += `<p>${capitalize(description || title)}. This product is optimized for ecommerce listings, combining functionality, durability and practical design for modern buyers.</p>`;

  html += `<h3>Main Benefits</h3>`;
  html += `<ul>`;

  if (features.length === 0) {

    html += `<li>Reliable design for everyday use</li>`;
    html += `<li>Durable construction for long term performance</li>`;
    html += `<li>Easy to use for different environments</li>`;

  } else {

    features.forEach(f => {
      html += `<li>${f}</li>`;
    });

  }

  html += `</ul>`;

  html += `<h3>Product Features</h3>`;
  html += `<ul>`;
  html += `<li>Durable materials for long term usage</li>`;
  html += `<li>Practical and ergonomic design</li>`;
  html += `<li>Simple setup and operation</li>`;
  html += `</ul>`;

  html += `<h3>How to Use</h3>`;
  html += `<p>${capitalize(title)} can be used easily following typical usage practices for this product category.</p>`;

  if (category === "pet_supplies") {

    html += `<h3>Recommended Use</h3>`;
    html += `<p>Helps support pet training routines and daily behavior reinforcement.</p>`;

  }

  html += `<h3>Ideal For</h3>`;
  html += `<p>Buyers looking for a reliable and practical solution in this product category.</p>`;

  return normalizeWhitespace(html);
}

function optimizeRegionalDescription({
  optimizedTitle = "",
  translatedDescription = "",
  storeProfile = {},
  category = "general"
}) {

  const language = String(storeProfile.language || "en-US").toLowerCase();

  if (language.startsWith("es")) {

    return buildSpanishDescription({
      title: optimizedTitle,
      description: translatedDescription,
      category
    });

  }

  return buildEnglishDescription({
    title: optimizedTitle,
    description: translatedDescription,
    category
  });
}

/*
========================================
PIPELINE ADAPTER
Compatibilidad con Import Pipeline
========================================
*/

function generateDescription({
  title = "",
  description = "",
  category = "general",
  country = "DEFAULT"
} = {}) {

  const storeProfile = {
    language: country === "MX" ? "es-MX" : "en-US",
    country
  };

  return optimizeRegionalDescription({
    optimizedTitle: title,
    translatedDescription: description,
    storeProfile,
    category
  });

}

module.exports = {
  optimizeRegionalDescription,
  generateDescription
};
