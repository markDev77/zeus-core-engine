/*
========================================
ZEUS DUPLICATE PRODUCT BLOCKER
========================================
Detecta si un producto ya existe en el
Signature Registry y decide acción
========================================
*/

const { getSignature } = require("./productSignatureRegistry");

function checkDuplicateProduct({
  signature,
  shopDomain,
  productId
}) {

  if (!signature) {
    return {
      status: "UNKNOWN",
      reason: "missing signature"
    };
  }

  const existing = getSignature(signature);

  if (!existing) {
    return {
      status: "ALLOW",
      reason: "new product"
    };
  }

  const sameStore =
    existing.stores &&
    existing.stores.includes(shopDomain);

  const sameProduct =
    existing.products &&
    existing.products.includes(productId);

  if (sameStore && sameProduct) {

    return {
      status: "ALLOW",
      reason: "same product update"
    };

  }

  if (!sameStore) {

    return {
      status: "MERGE",
      reason: "same product different store",
      existing
    };

  }

  return {
    status: "BLOCK",
    reason: "duplicate product detected",
    existing
  };

}

module.exports = {
  checkDuplicateProduct
};
