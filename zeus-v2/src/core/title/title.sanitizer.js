// title.sanitizer.js

function sanitizeTitle(title, context) {
  if (!title) return "";

  let clean = title;

  clean = clean.replace(/[|<>]/g, "");
  clean = clean.replace(/\s+/g, " ").trim();

  if (clean.length > 70) {
    clean = clean.substring(0, 70).trim();
  }

  return clean;
}

module.exports = {
  sanitizeTitle,
};
