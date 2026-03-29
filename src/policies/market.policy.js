"use strict";

/**
 * ZEUS - Market Policy Layer v2
 * -----------------------------------------
 * Ahora incluye:
 * - limpieza estructural
 * - eliminación de duplicados
 * - control de formato final REAL
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
    bannedWords: profile.bannedWords || [],
    replacementMap: profile.replacementMap || {},
    cta: profile.cta || null
  };
}

function applyMarketRulesToTitle(title, rules = {}) {
  if (!title) return "";

  let result = title;

  result = applyReplacementMap(result, rules.replacementMap);
  result = removeBannedWords(result, rules.bannedWords);
  result = normalizeSpaces(result);
  result = dedupeWords(result);
  result = applyTitleStyle(result, rules.titleStyle);

  return trim(result, 140);
}

function applyMarketRulesToDescription(description, rules = {}) {
  if (!description) return "";

  let result = description;

  // 🔥 NUEVO: limpieza estructural
  result = stripMarkdownArtifacts(result);
  result = stripCodeBlocks(result);
  result = removeDuplicateBlocks(result);
  result = removeTemplatePhrases(result);

  result = applyReplacementMap(result, rules.replacementMap);
  result = removeBannedWords(result, rules.bannedWords);
  

  result = cleanHtml(result);

  // 🔥 CONTROL TOTAL DE FORMATO
  result = enforceSingleFormat(result, rules.descriptionStyle);

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
 * REGION RESOLUTION
 * ----------------------------------------- */

function resolveRegionProfile(country, language) {
  const key = `${language}-${country}`.toUpperCase();
  return REGION_PROFILES[key] || REGION_PROFILES["DEFAULT"];
}

/* -----------------------------------------
 * 🔥 CLEANING LAYER (NUEVO)
 * ----------------------------------------- */

function stripMarkdownArtifacts(value) {
  return value
    .replace(/```html/g, "")
    .replace(/```/g, "");
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

function cleanHtml(value) {
  return value
    .replace(/<html[\s\S]*?>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head>[\s\S]*?<\/head>/gi, "")
    .trim();
}

/* -----------------------------------------
 * 🔥 FORMAT CONTROL (CLAVE)
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
    .map(l => l.replace(/<[^>]+>/g, ""))
    .map(l => l.trim())
    .filter(l => l.length > 20 && l.length < 120)
    .slice(0, 5);

  return items
    .map((l) => `• ${cleanLine(l)}`)
    .join("\n");
}

function toParagraphOnly(value) {
  return normalizeSpaces(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\n+/g, " ")
  );
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
        !lower.includes("diseñado para ofrecer") &&
        !lower.includes("material:") &&
        !lower.includes("categoría") &&
        !lower.includes("product category")
      );
    });
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
 * COMMON HELPERS
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
