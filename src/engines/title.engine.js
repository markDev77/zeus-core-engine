// /src/engines/title.engine.js

function generateTitle(rawTitle) {
  if (!rawTitle) return null;

  let title = rawTitle.toLowerCase();

  // limpieza básica
  title = title.replace(/new|2026|hot|sale|free shipping/gi, "");

  // traducción base inicial (fase 1)
  const map = {
    portable: "portátil",
    usb: "usb",
    fan: "ventilador",
    mini: "mini",
    electric: "eléctrico",
    juicer: "licuadora"
  };

  Object.keys(map).forEach(k => {
    title = title.replace(new RegExp(k, "gi"), map[k]);
  });

  // limpieza espacios
  title = title.replace(/\s+/g, " ").trim();

  // capitalización
  title = title
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // recorte seguro
  if (title.length > 60) {
    title = title.slice(0, 60).trim();
  }

  return title;
}

module.exports = {
  generateTitle
};
