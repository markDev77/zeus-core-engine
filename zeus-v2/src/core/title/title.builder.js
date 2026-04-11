// title.builder.js

function buildTitle(input, context) {
  const original = input.title || "";

  let title = original
    .replace(/[-_,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return title;
}

module.exports = {
  buildTitle,
};
