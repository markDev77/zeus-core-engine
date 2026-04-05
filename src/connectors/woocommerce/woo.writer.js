const axios = require("axios");

async function writeWooProduct({ productId, data }) {
  try {
    const baseUrl = "https://lo-tengo.com.mx";

    const consumerKey = process.env.WOO_KEY;
    const consumerSecret = process.env.WOO_SECRET;

    if (!consumerKey || !consumerSecret) {
      console.log("⛔ WOO CREDENTIALS MISSING");
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
    console.error("❌ WOO WRITE ERROR", error.message);
    return { success: false };
  }
}

module.exports = {
  writeWooProduct
};
