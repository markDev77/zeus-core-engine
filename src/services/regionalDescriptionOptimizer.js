/*
========================================
ZEUS REGIONAL DESCRIPTION OPTIMIZER v2
SEO LONG DESCRIPTION HTML
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
    features.push("Sistema de entrenamiento eficiente");

  if (source.includes("control remoto") || source.includes("remote"))
    features.push("Incluye control remoto para entrenamiento");

  return features;
}

function buildSpanishDescription({ title = "", description = "", category = "general" }) {

  const source = `${title} ${description}`.toLowerCase();

  const features = detectFeatures(source);

  let html = "";

  html += `<h2>${capitalize(title)}</h2>`;
  html += `<p>${capitalize(description || title)}. Producto optimizado para ecommerce en México y Latinoamérica.</p>`;
  html += `<h3>Beneficios principales</h3>`;
  html += `<ul>`;

  if (features.length === 0) {

    html += `<li>Diseñado para ofrecer rendimiento confiable</li>`;
    html += `<li>Uso práctico para el día a día</li>`;

  } else {

    features.forEach(f => {
      html += `<li>${f}</li>`;
    });

  }

  html += `</ul>`;

  html += `<h3>Características del producto</h3>`;
  html += `<p>${capitalize(title)} diseñado para ofrecer durabilidad, funcionalidad y facilidad de uso.</p>`;

  if (category === "pet_supplies") {

    html += `<h3>Uso recomendado</h3>`;
    html += `<p>Ideal para mejorar rutinas de entrenamiento y control de comportamiento en mascotas.</p>`;

  }

  html += `<p>Optimizado automáticamente por ZEUS.</p>`;

  return normalizeWhitespace(html);
}

function buildEnglishDescription({ title = "", description = "", category = "general" }) {

  const source = `${title} ${description}`.toLowerCase();

  const features = detectFeatures(source);

  let html = "";

  html += `<h2>${capitalize(title)}</h2>`;
  html += `<p>${capitalize(description || title)}. Optimized for ecommerce product listings.</p>`;
  html += `<h3>Main Benefits</h3>`;
  html += `<ul>`;

  if (features.length === 0) {

    html += `<li>Reliable performance design</li>`;
    html += `<li>Practical everyday use</li>`;

  } else {

    features.forEach(f => {
      html += `<li>${f}</li>`;
    });

  }

  html += `</ul>`;

  html += `<h3>Product Details</h3>`;
  html += `<p>${capitalize(title)} designed for durability and usability.</p>`;

  if (category === "pet_supplies") {

    html += `<h3>Recommended Use</h3>`;
    html += `<p>Helps support pet training routines and behavior reinforcement.</p>`;

  }

  html += `<p>Automatically optimized by ZEUS.</p>`;

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
Permite usar el optimizer desde
Import Pipeline
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
