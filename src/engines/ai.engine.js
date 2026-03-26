const axios = require("axios");

async function generateAIContent({ title, category }) {
  try {
    const prompt = `
Optimiza este producto para ecommerce en México.

Producto:
${title}

Categoría:
${category}

Reglas:
- Español México
- No repetir título
- Enfocado a conversión
- Incluir contexto de uso real (ej: cocina, hogar, oficina, belleza, etc)
- 120 a 180 palabras
- No genérico
- No inventar características técnicas

Entrega SOLO texto limpio en HTML con <p> y <ul>
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (err) {
    console.log("AI ERROR:", err.message);
    return null;
  }
}

module.exports = {
  generateAIContent
};
