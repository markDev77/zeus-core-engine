/*
========================================
ZEUS MARKET SIGNAL DEFINITIONS
========================================
Eventos globales y regionales
========================================
*/

const signals = [

{
id: "black_friday",
countries: ["US","MX","CO","SV"],
months: [11],
priority: 10,
keywords: ["deal","sale","oferta"],
titleSuffix: {
US: "Black Friday Deal",
MX: "Oferta Black Friday",
CO: "Oferta Black Friday",
SV: "Oferta Black Friday"
}
},

{
id: "navidad",
countries: ["MX","CO","SV","US"],
months: [12],
priority: 8,
keywords: ["regalo","gift","navidad"],
titleSuffix: {
US: "Christmas Gift Idea",
MX: "Regalo Ideal de Navidad",
CO: "Regalo Ideal de Navidad",
SV: "Regalo Ideal de Navidad"
}
},

{
id: "hot_sale",
countries: ["MX"],
months: [5],
priority: 9,
keywords: ["hot sale","oferta"],
titleSuffix: {
MX: "Oferta Hot Sale"
}
},

{
id: "buen_fin",
countries: ["MX"],
months: [11],
priority: 9,
keywords: ["buen fin","oferta"],
titleSuffix: {
MX: "Oferta Buen Fin"
}
},

{
id: "world_cup",
countries: ["MX","CO","SV","US"],
months: [6,7],
priority: 6,
keywords: ["futbol","soccer"],
titleSuffix: {
US: "World Cup Special",
MX: "Especial Mundial",
CO: "Especial Mundial",
SV: "Especial Mundial"
}
}

];

module.exports = {
signals
};
