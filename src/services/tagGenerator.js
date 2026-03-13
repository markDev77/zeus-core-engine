function generateTags(title) {

  return title
    .toLowerCase()
    .split(" ")
    .slice(0,5);

}

module.exports = {
  generateTags
};
