/*
========================================
ZEUS PRODUCT INTELLIGENCE ENGINE
========================================
Genera información estructurada del
producto para enriquecer catálogo.
========================================
*/

function detectFeatures(text = "") {

  const source = text.toLowerCase();

  const features = [];

  if (source.includes("wireless") || source.includes("inalámbrico")) {
    features.push("Tecnología inalámbrica");
  }

  if (source.includes("rechargeable") || source.includes("recargable")) {
    features.push("Batería recargable");
  }

  if (source.includes("remote")) {
    features.push("Control remoto incluido");
  }

  if (source.includes("electric")) {
    features.push("Sistema eléctrico de entrenamiento");
  }

  return features;

}

function detectAttributes(text = "") {

  const source = text.toLowerCase();

  const attributes = {};

  if (source.includes("dog") || source.includes("perro")) {
    attributes.petType = "dog";
  }

  if (source.includes("wireless") || source.includes("inalámbrico")) {
    attributes.connectivity = "wireless";
  }

  if (source.includes("rechargeable") || source.includes("recargable")) {
    attributes.power = "rechargeable";
  }

  return attributes;

}

function buildBenefits(features = []) {

  const benefits = [];

  features.forEach(f => {

    if (f === "Tecnología inalámbrica") {
      benefits.push("Mayor libertad de movimiento para el entrenamiento.");
    }

    if (f === "Batería recargable") {
      benefits.push("Reduce costos al no requerir baterías desechables.");
    }

    if (f === "Control remoto incluido") {
      benefits.push("Permite controlar el entrenamiento a distancia.");
    }

  });

  return benefits;

}

function applyProductIntelligence(product = {}) {

  const text = `${product.title} ${product.description}`;

  const features = detectFeatures(text);

  const attributes = detectAttributes(text);

  const benefits = buildBenefits(features);

  return {

    ...product,

    features,

    benefits,

    attributes

  };

}

module.exports = {
  applyProductIntelligence
};
