// ZEUS v2 — System Contract
// Defines the immutable structural foundation of ZEUS

const SYSTEM_CONTRACT = Object.freeze({
  system: 'ZEUS',
  version: 'v2',

  principles: Object.freeze({
    neutrality: true,
    noHardcodedContext: true,
    noBusinessLogicInCore: true,
    noIntelligenceInConnectors: true,
    policyIsOnlyBusinessLayer: true,
    executionIsCoordinatorOnly: true,
    validationIsGateOnly: true,
  }),

  layers: Object.freeze([
    'core',
    'context',
    'signals',
    'policy',
    'execution',
    'validation',
    'connectors',
    'persistence',
    'orchestration'
  ]),

  rules: Object.freeze({
    noLayerMixing: true,
    noImplicitDependencies: true,
    noContextInference: true,
    noCrossLayerMutation: true,
    strictBoundaryEnforcement: true
  })
});

module.exports = SYSTEM_CONTRACT;
