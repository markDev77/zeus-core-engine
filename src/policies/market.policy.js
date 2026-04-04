"use strict";

/**
 * ZEUS - Market Policy Layer v3 (AI-aware)
 * -----------------------------------------
 * - Control de fuente (AI vs engine)
 * - Respeta HTML (no rompe imágenes)
 * - Limpieza estructural
 * - Formato controlado por policy
 */

const { REGION_PROFILES } = require("../data/regionProfiles");

/* -----------------------------------------
 * PUBLIC API
 * ----------------------------------------- */

function getMarketRules({ country, language }) {
  const profile = resolveRegionProfile(country, language);

  return {
    country: profile.country,
    language: profile.language,

    titleStyle: profile.titleStyle || "neutral",
    descriptionStyle: profile.descriptionStyle || "paragraph",

    // 🔥 NUEVO (CONTROL ZEUS)
    title_source: profile.title_source || "ai",
    description_source: profile.description_source || "ai",

    bannedWords: profile.bannedWords || [],
    replacementMap: profile.replacementMap || {},
    cta: profile.cta || null
  };
}

/* -----------------------------------------
 * TITLE
 * ----------------------------------------- */

function applyMarketRulesToTitle(title, rules = {}, context = {}) {
  const { aiTitle } = context;

  // 🔥 PRIORIDAD AI (ZEUS)
  if (rules.title_source === "ai" && aiTitle) {
    return trim(normalizeSpaces(aiTitle), 140);
  }

  if (!title) return "";

  let result = title;

  result = applyReplacementMap(result, rules.replacementMap);
  result = removeBannedWords(result, rules.bannedWords);

  result = normalizeSpaces(result);
  result = dedupeWords(result);

  result = applyTitleStyle(result, rules.titleStyle);

  return trim(result, 140);
}

/* -----------------------------------------
 * DESCRIPTION
 * ----------------------------------------- */

function applyMarketRulesToDescription(description, rules = {}, context = {}) {
  const { aiBlock } = context;

  // 🔥 PRIORIDAD AI (NO TOCAR HTML)
  if (rules.description_source === "ai" && aiBlock) {
  return `
    ${description}
    ${aiBlock}
  `;
}

  if (!description) return "";

  let result = description;

  result = stripMarkdownArtifacts(result);
  result = stripCodeBlocks(result);
  result = removeDuplicateBlocks(result);
  result = removeTemplatePhrases(result);

  result = applyReplacementMap(result, rules.replacementMap);
  result = removeBannedWords(result, rules.bannedWords);

  // ⚠️ SOLO LIMPIA HTML SUPERIOR (NO IMÁGENES)
result = cleanHtmlSafe(result);

// SOLO aplicar formato si NO hay HTML estructural real
if (!/<(img|table|div|section)/i.test(result)) {
  result = enforceSingleFormat(result, rules.descriptionStyle);
}

  if (rules.cta) {
    result = appendCTA(result, rules.cta);
  }

  return trim(result, 2200);
}

module.exports = {
  getMarketRules,
  applyMarketRulesToTitle,
  applyMarketRulesToDescription
};

/* -----------------------------------------
 * REGION
 * ----------------------------------------- */

function resolveRegionProfile(country, language) {
  const key = `${language}-${country}`.toUpperCase();
  return REGION_PROFILES[key] || REGION_PROFILES["DEFAULT"];
}

/* -----------------------------------------
 * CLEANING
 * ----------------------------------------- */

function stripMarkdownArtifacts(value) {
  return value.replace(/```html/g, "").replace(/```/g, "");
}

function stripCodeBlocks(value) {
  return value.replace(/```[\s\S]*?```/g, "");
}

function removeDuplicateBlocks(value) {
  const seen = new Set();

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

/**
 * 🔥 CRÍTICO: NO eliminar <img>
 */
function cleanHtmlSafe(value) {
  return value
    .replace(/<html[\s\S]*?>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head>[\s\S]*?<\/head>/gi, "")
    .trim();
}

/* -----------------------------------------
 * FORMAT
 * ----------------------------------------- */

function enforceSingleFormat(value, style) {
  switch (style) {
    case "bullets":
      return toBulletsOnly(value);

    case "storytelling":
      return toParagraphOnly(value);

    default:
      return toParagraphOnly(value);
  }
}

function toBulletsOnly(value) {
  const items = extractMeaningfulLines(value)
    .map((l) => l.replace(/<(?!img)[^>]+>/g, ""))
    .map((l) => l.trim())
    .filter((l) => l.length > 20 && l.length < 120)
    .slice(0, 5);

  return `<ul>${items.map((l) => `<li>${cleanLine(l)}</li>`).join("")}</ul>`;
}

function toParagraphOnly(value) {
  return `<p>${normalizeSpaces(
    value
      .replace(/<(?!img)[^>]+>/g, " ")
      .replace(/\n+/g, " ")
  )}</p>`;
}

function extractMeaningfulLines(value) {
  return value
    .replace(/<[^>]+>/g, "\n")
    .split(/\n|\. /)
    .map((l) => l.trim())
    .filter((l) => {
      const lower = l.toLowerCase();

      return (
        l.length > 25 &&
        !lower.includes("transforma") &&
        !lower.includes("imagina") &&
        !lower.includes("producto pensado") &&
        !lower.includes("ideal para quienes") &&
        !lower.includes("una alternativa pensada") &&
        !lower.includes("diseñado para ofrecer")
      );
    });
}

function removeTemplatePhrases(value) {
  const patterns = [
    /transforma[^.]*\./gi,
    /imagina[^.]*\./gi,
    /producto pensado[^.]*\./gi,
    /ideal para quienes[^.]*\./gi,
    /una alternativa pensada[^.]*\./gi,
    /diseñado para[^.]*\./gi
  ];

  let result = value;

  patterns.forEach((regex) => {
    result = result.replace(regex, "");
  });

  return result;
}

/* -----------------------------------------
 * TITLE HELPERS
 * ----------------------------------------- */

function applyTitleStyle(value, style) {
  switch (style) {
    case "uppercase":
      return value.toUpperCase();

    case "title":
      return value.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
      );

    default:
      return capitalizeFirst(value);
  }
}

function dedupeWords(value) {
  const words = value.split(" ");
  const result = [];

  for (let i = 0; i < words.length; i++) {
    if (result[result.length - 1] !== words[i]) {
      result.push(words[i]);
    }
  }

  return result.join(" ");
}

/* -----------------------------------------
 * COMMON
 * ----------------------------------------- */

function applyReplacementMap(value, map = {}) {
  let result = value;

  Object.keys(map).forEach((key) => {
    const regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, "gi");
    result = result.replace(regex, map[key]);
  });

  return result;
}

function removeBannedWords(value, banned = []) {
  let result = value;

  banned.forEach((word) => {
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
    result = result.replace(regex, "");
  });

  return result;
}

function normalizeSpaces(value) {
  return value.replace(/\s+/g, " ").trim();
}

function appendCTA(value, cta) {
  return `${value}\n\n${cta}`;
}

function trim(value, max) {
  if (value.length <= max) return value;
  return value.substring(0, max);
}

function cleanLine(value) {
  return value.replace(/[.]+$/, "");
}

function capitalizeFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
