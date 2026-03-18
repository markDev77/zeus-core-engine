function optimizeTitle(title) {

  if (!title) {
    return "Untitled Product"
  }

  return String(title)
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

module.exports = optimizeTitle
