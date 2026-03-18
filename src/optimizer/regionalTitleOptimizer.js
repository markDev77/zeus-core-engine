function cleanSupplierTitle(title) {

  if (!title) return ""

  let cleaned = title

  // eliminar cantidades proveedor
  cleaned = cleaned.replace(/\b\d+\s*(piece|pieces|pcs|set|sets)\b/gi, "")

  // eliminar palabras basura proveedor
  cleaned = cleaned.replace(/\bnew\b/gi, "")
  cleaned = cleaned.replace(/\bbest\b/gi, "")
  cleaned = cleaned.replace(/\bpet\b$/gi, "")

  // limpiar espacios
  cleaned = cleaned.replace(/\s+/g, " ").trim()

  return cleaned

}

function localizeTitle(title, country) {

  if (!title) return ""

  if (country === "MX" || country === "ES") {

    if (title.toLowerCase().includes("dog training collar")) {

      return "Collar de Entrenamiento para Perro Recargable Inalámbrico"

    }

  }

  return title

}

function optimizeTitle(title, country = "DEFAULT") {

  const cleaned = cleanSupplierTitle(title)

  const localized = localizeTitle(cleaned, country)

  return localized || cleaned

}

module.exports = {
  optimizeTitle
}
