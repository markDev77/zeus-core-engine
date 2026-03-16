/*
========================================
ZEUS SEO STRUCTURE BUILDER
========================================
Genera estructura SEO para tienda

handle
slug
search keywords
structured data
========================================
*/

function normalize(text = "") {

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,:;\-–—]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}

function buildSlug(title = "") {

  return normalize(title)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);

}

function buildSearchKeywords(product = {}) {

  const words = [];

  if (product.title) {
    words.push(...String(product.title).split(" "));
  }

  if (Array.isArray(product.tags)) {
    words.push(...product.tags);
  }

  if (product.category) {
    words.push(product.category);
  }

  if (product.baseCategory) {
    words.push(product.baseCategory);
  }

  const clean = words
    .map((w) => normalize(w))
    .filter((w) => w.length > 3);

  const unique = [...new Set(clean)];

  return unique.slice(0, 20);

}

function buildSchema(product = {}) {

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: product.seoDescription || product.description,
    category: product.category,
    keywords: (product.tags || []).join(", ")
  };

}

function seoStructureBuilder(product = {}) {

  const cleanTitle = String(product.title || "")
    .replace(/[,:;\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const slug = buildSlug(cleanTitle);
  const searchKeywords = buildSearchKeywords({
    ...product,
    title: cleanTitle
  });
  const schema = buildSchema({
    ...product,
    title: cleanTitle
  });

  return {
    ...product,
    title: cleanTitle,
    handle: slug,
    slug,
    searchKeywords,
    structuredData: schema
  };

}

module.exports = {
  seoStructureBuilder
};
