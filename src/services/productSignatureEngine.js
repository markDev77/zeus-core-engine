/*
========================================
ZEUS PRODUCT SIGNATURE ENGINE
========================================
Detecta productos duplicados
basado en firma estructural
========================================
*/

const crypto = require("crypto");

function normalize(text = "") {

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}

function extractFirstImage(product = {}) {

  if (!product.images) return "";

  if (Array.isArray(product.images)) {
    return product.images[0] || "";
  }

  if (typeof product.images === "string") {
    return product.images;
  }

  return "";

}

function countVariants(product = {}) {

  if (!product.variants) return 0;

  if (Array.isArray(product.variants)) {
    return product.variants.length;
  }

  return 0;

}

function generateProductSignature(product = {}) {

  const normalizedTitle = normalize(product.title || "");

  const firstImage = extractFirstImage(product);

  const variantCount = countVariants(product);

  const signatureString =
    normalizedTitle +
    "|" +
    firstImage +
    "|" +
    variantCount;

  const hash = crypto
    .createHash("sha256")
    .update(signatureString)
    .digest("hex");

  return {
    signature: hash,
    signatureBase: signatureString
  };

}

module.exports = {
  generateProductSignature
};
