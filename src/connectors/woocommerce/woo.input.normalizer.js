function normalizeWooProductInput(payload = {}) {
  const rawTags = Array.isArray(payload.tags) ? payload.tags : [];
  const rawImages = Array.isArray(payload.images) ? payload.images : [];
  const rawCategories = Array.isArray(payload.categories) ? payload.categories : [];
  const rawMeta = Array.isArray(payload.meta_data) ? payload.meta_data : [];
  const rawVariations = Array.isArray(payload.variations) ? payload.variations : [];

  return {
    id: payload.id || payload.ID || null,
    external_id: payload.id || payload.ID || null,
    title: payload.name || payload.title || "",
    description:
      payload.description ||
      payload.short_description ||
      "",
    short_description: payload.short_description || "",
    images: rawImages,
    variants: rawVariations,
    categories: rawCategories,
    tags: rawTags,
    meta_data: rawMeta,
    raw: payload
  };
}

module.exports = {
  normalizeWooProductInput
};
