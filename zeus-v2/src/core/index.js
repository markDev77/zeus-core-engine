const runTitleEngine = require('./title/title-engine');
const runDescriptionEngine = require('./description/description-engine');
const runProductNormalizer = require('./normalize/product-normalizer');
const runProductSignature = require('./signature/product-signature');
const runAttributeExtraction = require('./attributes/attribute-extractor');
const runCategoryHintEngine = require('./category/category-hint-engine');
const runPolicyPrepEngine = require('./policy-prep/policy-prep-engine');

function runCore(input) {

    let output = { ...input };

    // DESCRIPTION
    output = runDescriptionEngine(output);

    // NORMALIZER
    output = runProductNormalizer(output);

    // SIGNATURE
    output = runProductSignature(output);

    // ATTRIBUTES
    output = runAttributeExtraction(output);

    // CATEGORY HINT
    output = runCategoryHintEngine(output);

    // POLICY PREP
    output = runPolicyPrepEngine(output);

    // ===== TITLE (ÚLTIMO PASO) =====
    output = runTitleEngine(output);

    return output;
}

module.exports = runCore;
