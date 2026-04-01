function extractUsadropContent(rawHtml) {
  try {
    if (!rawHtml || !rawHtml.trim()) {
      return {
        textBlock: "",
        htmlBlock: rawHtml
      };
    }

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

    return {
      textBlock,
      htmlBlock
    };

  } catch (err) {
    console.error("❌ USADROP EXTRACT ERROR:", err.message);
    return {
      textBlock: "",
      htmlBlock: rawHtml
    };
  }
}

module.exports = {
  description: {
    extractUsadropContent
  }
};
