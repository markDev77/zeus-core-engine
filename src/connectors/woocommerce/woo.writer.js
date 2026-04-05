const axios = require("axios");

async function writeWooProduct({ store, productId, data }) {
  try {
    const { baseUrl, consumerKey, consumerSecret } = store;

    if (!baseUrl || !consumerKey || !consumerSecret) {
      console.log("⛔ WOO CONFIG MISSING");
      return { success: false };
    }

    const url = `${baseUrl}/wp-json/wc/v3/products/${productId}`;

    const response = await axios.put(
      url,
      {
        name: data.title,
        description: data.description_html,
        short_description: data.short_description
      },
      {
        auth: {
          username: consumerKey,
          password: consumerSecret
        }
      }
    );

    console.log("✅ WOO WRITE SUCCESS", {
      productId,
      status: response.status
    });

    return { success: true };

  } catch (error) {
    console.error("❌ WOO WRITE ERROR", {
      message: error.message
    });

    return { success: false };
  }
}

module.exports = {
  writeWooProduct
};
