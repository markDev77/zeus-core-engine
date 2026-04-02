const { updateProduct } = require("./woo.client");

async function writeWooProduct(productId, payload) {
  return await updateProduct(productId, payload);
}

module.exports = {
  writeWooProduct,
};
