const { signals } = require("../data/marketSignals");

/*
========================================
ZEUS MARKET SIGNAL ENGINE
========================================
Detecta eventos activos por país y fecha
y ajusta optimización.
========================================
*/

function getCurrentMonth() {
return new Date().getMonth() + 1;
}

function detectActiveSignals(country) {

const month = getCurrentMonth();

const active = signals.filter(signal => {

if (!signal.countries.includes(country)) return false;

if (!signal.months.includes(month)) return false;

return true;

});

active.sort((a,b)=> b.priority - a.priority);

return active;
}

function applyMarketSignals(product, storeProfile) {

if (!storeProfile) return product;

if (storeProfile.marketSignalMode !== "enabled") {
return product;
}

const country = storeProfile.country || "US";

const activeSignals = detectActiveSignals(country);

if (!activeSignals.length) {
return product;
}

const signal = activeSignals[0];

const suffix =
(signal.titleSuffix && signal.titleSuffix[country]) ||
(signal.titleSuffix && signal.titleSuffix["US"]);

if (!suffix) return product;

const updatedTitle = `${product.title} | ${suffix}`;

return {

...product,

marketSignal: signal.id,

title: updatedTitle,

optimizedTitle: updatedTitle

};

}

module.exports = {
applyMarketSignals
};
