const runTitleEngine = require('./title/title-engine');
const runDescriptionEngine = require('./description/description-engine');
const runProductNormalizer = require('./normalize/product-normalizer');
const runProductSignature = require('./signature/product-signature');
const runAttributeExtraction = require('./attributes/attribute-extractor');
const runCategoryHintEngine = require('./category/category-hint-engine');
const runPolicyPrepEngine = require('./policy-prep/policy-prep-engine');

/**
 * ZEUS CORE ENGINE
 * Orquesta ejecución de engines internos
 *
 * REGLAS:
 * - Orden determinístico
 * - Sin lógica de negocio
 * - Cada engine respeta su responsabilidad
 */

function runCore(input) {

    let output = { ...input };

    // 1. DESCRIPTION (no depende de otros engines)
    output = runDescriptionEngine(output);

    // 2. NORMALIZER (limpia input base)
    output = runProductNormalizer(output);

    // 3. SIGNATURE (usa título base limpio)
    output = runProductSignature(output);

    // 4. ATTRIBUTES (usa contenido base)
    output = runAttributeExtraction(output);

    // 5. CATEGORY HINT (derivado semántico)
    output = runCategoryHintEngine(output);

    // 6. TITLE ENGINE (🔴 genera normalized_title)
    output = runTitleEngine(output);

    // 7. POLICY PREP (🔴 depende de normalized_title y signature)
    output = runPolicyPrepEngine(output);

    return output;
}

module.exports = runCore;
