// src/policies/woocommerce/ltm.policy.js

module.exports = async function ltmPolicy({ input, store, context }) {
  let output = { ...input };

  /**
   * =========================
   * CONTENT POLICY
   * =========================
   */
  // ya viene optimizado por engines
  // aquí solo puedes ajustar comportamiento si se requiere

  /**
   * =========================
   * PRICING POLICY
   * =========================
   */
  if (output.price) {
    const price = parseFloat(output.price);

    // ejemplo simple (puedes ajustar después)
    if (price < 5) output.price = (price + 5).toFixed(2);
    else if (price < 20) output.price = (price * 2).toFixed(2);
    else output.price = (price * 1.6).toFixed(2);
  }

  /**
   * =========================
   * INVENTORY POLICY
   * =========================
   */
  output.stock = 11;

  /**
   * =========================
   * WEIGHT POLICY
   * =========================
   */
  output.weight = 1;

  /**
   * =========================
   * METADATA
   * =========================
   */
  output._policy = {
    applied: "ltm-mx"
  };

  return output;
};
