async function localizeUsadropText({
  rawHtml,
  language,
  translateText
}) {
  try {
    if (!rawHtml || !rawHtml.trim()) return rawHtml;

    const splitIndex = rawHtml.search(/<[^>]+>/);

    let textBlock = "";
    let htmlBlock = "";

    if (splitIndex === -1) {
      textBlock = rawHtml;
    } else {
      textBlock = rawHtml.substring(0, splitIndex);
      htmlBlock = rawHtml.substring(splitIndex);
    }

    textBlock = textBlock
      .replace(/&nbsp;/g, " ")
      .trim();

    // 🔒 evitar consumo IA innecesario
    if (!textBlock || textBlock.replace(/\s/g, "").length < 10) {
      return rawHtml;
    }

    const translatedText = await translateText(textBlock, { language });

    if (!translatedText || !translatedText.trim()) {
      return rawHtml;
    }

    return `${translatedText}\n\n${htmlBlock}`;

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
