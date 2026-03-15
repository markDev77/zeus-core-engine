const axios = require("axios");

/*
====================================================
CHECK IF PRODUCT UPDATED BY ZEUS
====================================================
*/

async function isZeusUpdate(product) {

  try {

    if (!product) return false;

    const tags = product.tags;

    if (!tags) return false;

    if (typeof tags === "string") {

      return tags.includes("ZEUS_UPDATED");

    }

    if (Array.isArray(tags)) {

      return tags.includes("ZEUS_UPDATED");

    }

    return false;

  } catch (error) {

    console.log("LOOP CHECK ERROR:", error.message);
    return false;

  }

}

/*
====================================================
MARK PRODUCT AS UPDATED BY ZEUS
====================================================
*/

function markZeusUpdate(product) {

  try {

    if (!product) return product;

    let tags = product.tags;

    if (!tags) {

      product.tags = "ZEUS_UPDATED";
      return product;

    }

    if (typeof tags === "string") {

      if (!tags.includes("ZEUS_UPDATED")) {

        product.tags = tags + ",ZEUS_UPDATED";

      }

      return product;

    }

    if (Array.isArray(tags)) {

      if (!tags.includes("ZEUS_UPDATED")) {

        tags.push("ZEUS_UPDATED");

      }

      product.tags = tags;
      return product;

    }

    return product;

  } catch (error) {

    console.log("LOOP MARK ERROR:", error.message);
    return product;

  }

}

module.exports = {
  isZeusUpdate,
  markZeusUpdate
};
