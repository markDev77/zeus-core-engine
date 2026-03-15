/*
========================================
PIPELINE ADAPTER
========================================
Permite que el transformer use el engine
sin romper arquitectura existente
========================================
*/

function detectMarketSignal({ title = "", description = "" } = {}) {

  const text = `${title} ${description}`.toLowerCase();

  let score = 0;

  const keywords = [
    "wireless",
    "recargable",
    "rechargeable",
    "training",
    "entrenamiento",
    "smart",
    "portable"
  ];

  keywords.forEach(k => {
    if (text.includes(k)) score += 0.15;
  });

  if (score > 1) score = 1;

  return {
    score
  };

}
