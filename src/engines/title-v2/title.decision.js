// /src/engines/title-v2/title.decision.js

const { validateTitleContract } = require("./title.validator");
const { scoreTitleContract } = require("./title.scorer");

function evaluateTitleV2(contract) {
  const validation = validateTitleContract(contract);

  if (!validation.isValid) {
    return {
      usable: false,
      reason: "validation_failed",
      validation,
      score: 0,
      best_candidate: null
    };
  }

  const scoring = scoreTitleContract(contract);

  const candidates = contract.candidate_titles || [];

  // fallback seguro
  const bestCandidate =
    candidates.length > 0 && typeof candidates[0].value === "string"
      ? candidates[0].value
      : null;

  return {
    usable: true,
    validation,
    score: scoring.total_score,
    best_candidate: bestCandidate
  };
}

function evaluateAgainstV1({ v1Title, v2Evaluation }) {
  // 🔴 Si v2 no es usable → v1 gana
  if (!v2Evaluation.usable) {
    return {
      winner: "v1",
      reason: v2Evaluation.reason || "v2_not_usable",
      v1: v1Title,
      v2: null
    };
  }

  const score = v2Evaluation.score || 0;

  const hasStrongBase =
    v2Evaluation.validation?.isValid &&
    typeof v2Evaluation.best_candidate === "string" &&
    v2Evaluation.best_candidate.length > 0;

  // 🔥 NUEVA LÓGICA INTELIGENTE
  if (
    hasStrongBase &&
    (
      score >= 75 ||         // ideal
      score >= 65            // aceptable (más agresivo)
    )
  ) {
    return {
      winner: "v2",
      reason: score >= 75 ? "high_score" : "acceptable_score",
      v1: v1Title,
      v2: v2Evaluation.best_candidate,
      score
    };
  }

  // fallback seguro
  return {
    winner: "v1",
    reason: "score_too_low",
    v1: v1Title,
    v2: v2Evaluation.best_candidate,
    score
  };
}

module.exports = {
  evaluateTitleV2,
  evaluateAgainstV1
};
