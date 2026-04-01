async function localizeUsadropText({
  rawHtml,
  language,
  translateText
}) {
  try {
    if (!rawHtml || !rawHtml.trim()) return rawHtml;

    // 🔥 NUEVO: eliminar imágenes primero
    const textOnly = rawHtml
      .replace(/<img[^>]*>/gi, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    // 🔒 si no hay texto útil → no consumir IA
    if (!textOnly || textOnly.replace(/\s/g, "").length < 10) {
      return rawHtml;
    }

    const translatedText = await translateText(textOnly, { language });

    if (!translatedText || !translatedText.trim()) {
      return rawHtml;
    }

    // 🔥 mantener imágenes intactas
    const images = rawHtml.match(/<img[^>]*>/gi)?.join("") || "";

    return `${translatedText}\n\n${images}`;

  } catch (err) {
    console.error("❌ USADROP LOCALIZER ERROR:", err.message);
    return rawHtml;
  }
}

module.exports = {
  description: {
    localizeUsadropText
  }
};
