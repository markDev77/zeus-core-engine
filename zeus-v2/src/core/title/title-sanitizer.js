function sanitizeTitle(rawTitle) {
    if (!rawTitle || typeof rawTitle !== 'string') return '';

    return rawTitle
        .replace(/\s+/g, ' ')          // espacios múltiples
        .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ]/g, '') // caracteres raros
        .trim();
}

module.exports = sanitizeTitle;
