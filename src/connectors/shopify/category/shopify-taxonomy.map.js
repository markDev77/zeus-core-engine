// Shopify Taxonomy Mapping
// Clave normalizada ZEUS → Shopify category string

const SHOPIFY_TAXONOMY_MAP = {
  // HOGAR
  "hogar>iluminacion>lamparas decorativas>luz nocturna led":
    "Home & Garden > Lighting > Night Lights",

  "hogar>iluminacion>lamparas decorativas":
    "Home & Garden > Lighting > Lamps",

  "hogar>iluminacion":
    "Home & Garden > Lighting",

  // ELECTRÓNICA
  "electronica>audio>audifonos":
    "Electronics > Audio > Headphones",

  "electronica>accesorios>cables":
    "Electronics > Accessories > Cables",

  // MODA
  "moda>ropa>playeras":
    "Apparel & Accessories > Clothing > Shirts & Tops",

  // DEFAULT CONTROLADO
  "default":
    null
};

module.exports = {
  SHOPIFY_TAXONOMY_MAP
};
