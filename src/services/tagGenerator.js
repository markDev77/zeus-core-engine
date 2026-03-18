function cleanText(text = "") {
  return String(text || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<div[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateTags(title) {
  return cleanText(title)
    .toLowerCase()
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
    .slice(0, 5);
}

module.exports = {
  generateTags
};
