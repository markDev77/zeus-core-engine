function getMetaValue(metaData = [], key) {
  if (!Array.isArray(metaData)) return null;

  const found = metaData.find((item) => item && item.key === key);
  return found ? found.value : null;
}

function isRecentZeusSelfWrite({ metaData = [], currentHash }) {
  const lastOrigin = getMetaValue(metaData, "_zeus_last_write_origin");
  const lastHash = getMetaValue(metaData, "_zeus_last_write_hash");
  const lastWriteAt = getMetaValue(metaData, "_zeus_last_write_at");

  const ageMs = lastWriteAt
    ? Date.now() - new Date(lastWriteAt).getTime()
    : null;

  const isRecentZeusWrite =
    lastOrigin === "zeus" &&
    lastHash &&
    currentHash &&
    lastHash === currentHash &&
    Number.isFinite(ageMs) &&
    ageMs >= 0 &&
    ageMs <= 5 * 60 * 1000;

  return {
    blocked: Boolean(isRecentZeusWrite),
    debug: {
      lastOrigin,
      lastHash,
      lastWriteAt,
      currentHash,
      ageMs
    }
  };
}

module.exports = {
  getMetaValue,
  isRecentZeusSelfWrite
};
