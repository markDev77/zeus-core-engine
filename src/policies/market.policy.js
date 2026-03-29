"use strict";

/**
 * ZEUS - Market Policy Layer
 * -----------------------------------------
 * Final adaptation layer AFTER engines
 * BEFORE payload builder
 *
 * NO AI
 * NO business logic
 * NO connector logic
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

  result = trim(result, 140);

  return result;
}

function applyMarketRulesToDescription(description, rules = {}) {
  if (!description) return "";

  let result = description;

  result = applyReplacementMap(result, rules.replacementMap);
  result = removeBannedWords(result, rules.bannedWords);

  result = normalizeParagraphs(result);

  result = applyDescriptionStyle(result, rules.descriptionStyle);

  if (rules.cta) {
    result = appendCTA(result, rules.cta);
  }

  result = trim(result, 2200);

  return result;
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
  if (!country && !language) return REGION_PROFILES["DEFAULT"];

  const key = `${language || ""}-${country || ""}`.toUpperCase();

  if (REGION_PROFILES[key]) return REGION_PROFILES[key];

  const fallbackLang = Object.values(REGION_PROFILES).find(
    (r) => r.language === language
  );

  if (fallbackLang) return fallbackLang;

  return REGION_PROFILES["DEFAULT"];
}

/* -----------------------------------------
 * TITLE HELPERS
 * ----------------------------------------- */

function applyTitleStyle(value, style) {
  switch (style) {
    case "uppercase":
      return value.toUpperCase();

    case "title":
      return value.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
      });

    case "neutral":
    default:
      return capitalizeFirst(value);
  }
}

function dedupeWords(value) {
  const words = value.split(" ");
  const clean = [];

  for (let i = 0; i < words.length; i++) {
    if (clean[clean.length - 1] !== words[i]) {
      clean.push(words[i]);
    }
  }

  return clean.join(" ");
}

/* -----------------------------------------
 * DESCRIPTION HELPERS
 * ----------------------------------------- */

function applyDescriptionStyle(value, style) {
  switch (style) {
    case "bullets":
      return toBullets(value);

    case "storytelling":
      return toStorytelling(value);

    case "paragraph":
    default:
      return value;
  }
}

function toBullets(value) {
  const lines = splitLines(value).slice(0, 5);

  return lines.map((l) => `• ${cleanLine(l)}`).join("\n");
}

function toStorytelling(value) {
  const clean = normalizeSpaces(value);
  return clean;
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

function normalizeParagraphs(value) {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

function appendCTA(value, cta) {
  if (!cta) return value;
  return `${value}\n\n${cta}`;
}

function trim(value, max) {
  if (value.length <= max) return value;
  return value.substring(0, max).replace(/\s+\S*$/, "");
}

function splitLines(value) {
  return value
    .split(/\n|\. /)
    .map((l) => l.trim())
    .filter(Boolean);
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
