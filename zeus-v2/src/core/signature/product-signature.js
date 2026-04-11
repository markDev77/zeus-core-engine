function generateSignature(text) {

    if (!text) return '';

    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    return hash.toString();
}

function runProductSignature(input) {

    const normalized_title = input.core?.normalized_title || '';

    const product_signature = generateSignature(normalized_title);

    return {
        ...input,
        core: {
            ...input.core,
            product_signature
        }
    };
}

module.exports = runProductSignature;
