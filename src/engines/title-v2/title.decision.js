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

  const bestCandidate = candidates.length > 0
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
  if (!v2Evaluation.usable) {
    return {
      winner: "v1",
      reason: v2Evaluation.reason || "v2_not_usable",
      v1: v1Title,
      v2: null
    };
  }

  // Umbral simple inicial (ajustable)
  if (v2Evaluation.score >= 70) {
    return {
      winner: "v2",
      reason: "high_score",
      v1: v1Title,
      v2: v2Evaluation.best_candidate
    };
  }

  return {
    winner: "v1",
    reason: "score_too_low",
    v1: v1Title,
    v2: v2Evaluation.best_candidate
  };
}

module.exports = {
  evaluateTitleV2,
  evaluateAgainstV1
};
