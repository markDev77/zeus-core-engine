// ZEUS v2 — Module Boundaries Contract
// Defines allowed and forbidden dependencies between layers

const MODULE_BOUNDARIES = Object.freeze({

  allowed: Object.freeze({
    app: ['orchestration', 'contracts', 'observability'],

    orchestration: ['execution', 'validation', 'contracts', 'observability'],

    execution: ['validation', 'contracts', 'core', 'policy', 'persistence', 'observability'],

    validation: ['contracts', 'shared', 'observability'],

    context: ['contracts', 'shared', 'observability'],

    signals: ['contracts', 'shared', 'observability'],

    core: ['contracts', 'shared', 'observability'],

    policy: ['contracts', 'shared', 'observability', 'persistence'],

    connectors: ['contracts', 'validation', 'shared', 'observability'],

    jobs: ['execution', 'persistence', 'contracts', 'observability'],

    persistence: ['contracts', 'shared', 'observability'],

    admin: ['persistence', 'contracts', 'validation', 'observability'],

    shared: [],

    observability: []
  }),

  forbidden: Object.freeze({
    core: ['policy', 'connectors', 'persistence', 'context', 'signals', 'jobs'],
    connectors: ['orchestration', 'execution', 'policy', 'core', 'persistence', 'context', 'signals'],
    context: ['persistence', 'core', 'policy', 'execution', 'connectors'],
    signals: ['persistence', 'core', 'policy', 'execution', 'connectors'],
    execution: ['context', 'signals'], // direct resolution forbidden
    jobs: ['validation', 'core', 'policy', 'connectors'],
    policy: ['connectors', 'orchestration', 'execution'],
    validation: ['core', 'policy', 'connectors'],
    persistence: ['core', 'policy', 'execution', 'connectors'],
    shared: ['policy', 'context', 'connectors']
  })

});

module.exports = MODULE_BOUNDARIES;
