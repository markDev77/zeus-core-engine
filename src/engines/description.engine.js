// ZEUS DESCRIPTION ENGINE PRO (V2)
// Compatible con:
// - legacy (Shopify)
// - structured (LTM)

function buildDescription({ originalHtml, aiResult, language }) {
  try {
    // ==========================
    // 🌍 LANGUAGE TITLES
    // ==========================
    const titles = {
      es: {
        benefits: "Beneficios y uso",
        features: "Características",
        differentiator: "Diferenciador"
      },
      en: {
        benefits: "Benefits & Usage",
        features: "Features",
        differentiator: "Key Differentiator"
      },
      fr: {
        benefits: "Avantages et utilisation",
        features: "Caractéristiques",
        differentiator: "Différenciateur"
      },
      de: {
        benefits: "Vorteile und Nutzung",
        features: "Eigenschaften",
        differentiator: "Differenzierungsmerkmal"
      }
    };

    const lang = (language || "en").toLowerCase();
    const t = titles[lang] || titles["en"];

    // ==========================
    // 🔹 NORMALIZE INPUT (🔥 CLAVE)
    // ==========================

    const benefits = aiResult?.benefits || aiResult?.bullets || [];
    const features = aiResult?.features || aiResult?.specs || [];
    const differentiator = aiResult?.differentiator || "";

    // ==========================
    // 🔹 INTRO
    // ==========================
    const intro = aiResult?.intro
      ? `<p>${aiResult.intro}</p>`
      : "";

    // ==========================
    // 🔹 BENEFITS
    // ==========================
    const benefitsHtml = benefits
      .slice(0, 5)
      .map(b => `<li>${b}</li>`)
      .join("");

    const benefitsBlock = benefitsHtml
      ? `
<h3>${t.benefits}</h3>
<ul>
${benefitsHtml}
</ul>`
      : "";

    // ==========================
    // 🔹 FEATURES
    // ==========================
    const originalText = (originalHtml || "").toLowerCase();

    const featuresHtml = features
      .filter(f => {
        const clean = f.toLowerCase().slice(0, 40);
        return !originalText.includes(clean);
      })
      .slice(0, 6)
      .map(f => `<li>${f}</li>`)
      .join("");

    const featuresBlock = featuresHtml
      ? `
<h3>${t.features}</h3>
<ul>
${featuresHtml}
</ul>`
      : "";

    // ==========================
    // 🔹 DIFFERENTIATOR (🔥 NUEVO)
    // ==========================
    const differentiatorBlock =
      differentiator && differentiator.length > 15
        ? `
<h3>${t.differentiator}</h3>
<p>${differentiator}</p>`
        : "";

    // ==========================
    // 🔥 FINAL OUTPUT
    // ==========================
    return (
      intro +
      benefitsBlock +
      featuresBlock +
      differentiatorBlock +
      (originalHtml || "")
    );

  } catch (err) {
    console.error("ZEUS DESCRIPTION ENGINE ERROR:", err);
    return originalHtml || "";
  }
}

module.exports = {
  buildFinalDescription: buildDescription
};
