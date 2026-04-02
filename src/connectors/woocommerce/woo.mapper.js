function mapWooToZeus(product) {
  return {
    input: {
      title: product?.name || "",
      description: product?.description || "",
    },
    taxonomy: {
      categories: Array.isArray(product?.categories)
        ? product.categories.map(c => ({
            id: c.id || c.term_id || null,
            name: c.name || ""
          })).filter(c => c.id)
        : []
    }
  };
}

function mapZeusToWoo(aiResult, originalProduct) {
  return {
    name: aiResult?.title || originalProduct?.name || "",
    description: aiResult?.description || originalProduct?.description || "",
    categories: Array.isArray(originalProduct?.categories)
      ? originalProduct.categories.map(c => ({
          id: c.id || c.term_id
        })).filter(c => c.id)
      : []
  };
}

module.exports = {
  mapWooToZeus,
  mapZeusToWoo,
};
