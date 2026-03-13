function optimizeTitle(title) {

  return title
    .replace(/1\s*(piece|pcs|set)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

}

module.exports = {
  optimizeTitle
};
