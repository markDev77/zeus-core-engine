const runTitleEngine = require('./title/title-engine');
const runDescriptionEngine = require('./description/description-engine');
const runProductNormalizer = require('./normalizer/product-normalizer');
const runProductSignature = require('./signature/product-signature');
const runAttributeExtraction = require('./attributes/attribute-extractor');

function runCore(input) {

    let output = { ...input };

    // TITLE
    output = runTitleEngine(output);

    // DESCRIPTION
    output = runDescriptionEngine(output);

    // NORMALIZER
    output = runProductNormalizer(output);

    // SIGNATURE
    output = runProductSignature(output);

    // ATTRIBUTES
    output = runAttributeExtraction(output);

    return output;
}

module.exports = runCore;
