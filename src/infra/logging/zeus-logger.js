function log(level, event, payload = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...payload
  };

  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "WARNING") {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (event, payload) => log("INFO", event, payload),
  warning: (event, payload) => log("WARNING", event, payload),
  error: (event, payload) => log("ERROR", event, payload)
};
