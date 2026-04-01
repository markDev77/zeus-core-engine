// ZEUS DESCRIPTION ENGINE PRO
// Usa aiResult existente (NO genera IA nueva)
// Mantiene HTML original intacto al final

function buildDescription({ originalHtml, aiResult, language }) {
  try {
    // ==========================
    // 🌍 LANGUAGE TITLES
    // ==========================
    const titles = {
      es: {
        benefits: "Beneficios y uso",
        features: "Características"
      },
      en: {
        benefits: "Benefits & Usage",
        features: "Features"
      },
      fr: {
        benefits: "Avantages et utilisation",
        features: "Caractéristiques"
      },
      de: {
        benefits: "Vorteile und Nutzung",
        features: "Eigenschaften"
      }
    };

    const lang = (language || "en").toLowerCase();
    const t = titles[lang] || titles["en"];

    // ==========================
    // 🔹 INTRO
    // ==========================
    const intro = aiResult?.intro
      ? `<p>${aiResult.intro}</p>`
      : "";

    // ==========================
    // 🔹 BENEFITS
    // ==========================
    const bullets = (aiResult?.bullets || [])
      .slice(0, 5)
      .map(b => `<li>${b}</li>`)
      .join("");

    const benefitsBlock = bullets
      ? `
<h3>${t.benefits}</h3>
<ul>
${bullets}
</ul>`
      : "";

    // ==========================
    // 🔹 SPECS (CONTROLADO)
    // ==========================
    const originalText = (originalHtml || "").toLowerCase();

    const specs = (aiResult?.specs || [])
      .filter(s => {
        const clean = s.toLowerCase().slice(0, 40);
        return !originalText.includes(clean);
      })
      .slice(0, 4)
      .map(s => `<li>${s}</li>`)
      .join("");

    const specsBlock = specs
      ? `
<h3>${t.features}</h3>
<ul>
${specs}
</ul>`
      : "";

    // ==========================
    // 🔥 FINAL OUTPUT (FIXED)
    // ==========================

  return `${intro}${benefitsBlock}${specsBlock}${originalHtml || ""}`;

  } catch (err) {
    console.error("ZEUS DESCRIPTION ENGINE ERROR:", err);
    return originalHtml || "";
  }
}

// ---------------- HELPERS (IA-FIRST) ----------------

// 🔥 Intro desde IA (storytelling)
function buildIntro(aiResult, language) {
  const text = aiResult?.intro;

  if (text && text.length > 20) {
    return `<p><strong>${text}</strong></p>`;
  }

  return "";
}

// 🔥 Beneficios desde IA
function buildBenefits(aiResult, language) {
  const items = aiResult?.bullets || [];

  if (!items.length) return "";

  const title = language === "es" ? "Beneficios clave:" : "Key benefits:";

  const list = items
    .map(i => {
      const short = i.split(",")[0];
      return `<li>${short.trim()}</li>`;
    })
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

// 🔥 Specs desde IA
function buildSpecs(aiResult, language) {
  const items = aiResult?.specs || [];

  if (!items.length) return "";

  const title = language === "es" ? "Características:" : "Features:";

  const list = items
    .map(i => `<li>${i}</li>`)
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

// 🔥 Trust opcional
function buildTrust(aiResult, language) {
  const items = aiResult?.trust || [];

  if (!items.length) return "";

  const list = items
    .map(i => `<li>${i}</li>`)
    .join("");

  return `<ul>${list}</ul>`;
}

function buildUsage(aiResult, language) {
  const items = aiResult?.bullets || [];

  if (!items.length) return "";

  const usageItems = items.filter(i =>
    i.toLowerCase().includes("uso") ||
    i.toLowerCase().includes("ideal") ||
    i.toLowerCase().includes("perfect") ||
    i.toLowerCase().includes("para") ||
    i.toLowerCase().includes("for")
  );

  if (!usageItems.length) return "";

  const title = language === "es"
    ? "Uso y funcionalidad:"
    : "Usage and functionality:";

  const list = usageItems
    .slice(0, 3)
    .map(i => `<li>${i}</li>`)
    .join("");

  return `
    <h3>${title}</h3>
    <ul>${list}</ul>
  `;
}

module.exports = {
  buildFinalDescription: buildDescription
};
