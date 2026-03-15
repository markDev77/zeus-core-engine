/*
====================================================
ZEUS LOOP PROTECTION
====================================================
Evita que los updates hechos por ZEUS disparen
de nuevo el webhook de Shopify.
====================================================
*/

const zeusUpdates = new Map();

/*
====================================================
CHECK IF PRODUCT UPDATED BY ZEUS
====================================================
*/

function isZeusUpdate(product) {

  try {

    if (!product) return false;

    const id = product.id;

    if (!id) return false;

    if (zeusUpdates.has(id)) {

      return true;

    }

    return false;

  } catch (error) {

    console.log("LOOP CHECK ERROR:", error.message);
    return false;

  }

}

/*
====================================================
MARK PRODUCT UPDATED BY ZEUS
====================================================
*/

function markZeusUpdate(productId) {

  try {

    if (!productId) return;

    zeusUpdates.set(productId, Date.now());

    /*
    limpiar después de 30 segundos
    */

    setTimeout(() => {

      zeusUpdates.delete(productId);

    }, 30000);

  } catch (error) {

    console.log("LOOP MARK ERROR:", error.message);

  }

}

module.exports = {
  isZeusUpdate,
  markZeusUpdate
};
