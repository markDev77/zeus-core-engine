const runTitleEngine = require('./title/title-engine');
const runDescriptionEngine = require('./description/description-engine');

function runCore(input) {

    let output = { ...input };

    // TITLE
    output = runTitleEngine(output);

    // DESCRIPTION
    output = runDescriptionEngine(output);

    return output;
}

module.exports = runCore;
