function extractKeywords(normalizedTitle) {

    if (!normalizedTitle) return [];

    return normalizedTitle
        .split(' ')
        .filter(word => word.length > 2);
}

function runAttributeExtraction(input) {

    const normalized_title = input.core?.normalized_title || '';

    const keywords = extractKeywords(normalized_title);

    const attributes = {
        type: 'generic',
        keywords,
        word_count: keywords.length
    };

    return {
        ...input,
        core: {
            ...input.core,
            attributes
        }
    };
}

module.exports = runAttributeExtraction;
