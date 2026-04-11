// title.engine.js

const { buildTitle } = require("./title.builder");
const { sanitizeTitle } = require("./title.sanitizer");

function generateTitle(input, context) {
  if (!input || !input.title) return "";

  const builtTitle = buildTitle(input, context);
  const finalTitle = sanitizeTitle(builtTitle, context);

  return finalTitle;
}

module.exports = {
  generateTitle,
};
