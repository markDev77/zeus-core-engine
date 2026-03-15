const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../../logs/sync.log");

function logSync(entry) {

    const logLine = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...entry
    });

    fs.appendFileSync(logFile, logLine + "\n");

}

module.exports = {
    logSync
};
