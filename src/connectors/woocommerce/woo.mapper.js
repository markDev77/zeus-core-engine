function mapWooToZeus(product) {
  return {
    input: {
      title: product.name,
      description: product.description,
    },
    taxonomy: {
      categories: product.categories || []
    }
  };
}

function mapZeusToWoo(aiResult, originalProduct) {
  return {
    name: aiResult.title || originalProduct.name,
    description: aiResult.description || originalProduct.description,
    categories: (originalProduct.categories || []).map(c => ({
      id: c.id
    }))
  };
}

module.exports = {
  mapWooToZeus,
  mapZeusToWoo,
};
