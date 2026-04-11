const runTitleEngine = require('./title/title-engine');

function runCore(input) {

    let output = { ...input };

    // TITLE ENGINE (primer módulo real)
    output = runTitleEngine(output);

    return output;
}

module.exports = runCore;
