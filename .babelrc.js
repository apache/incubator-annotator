// Options for the @babel/transform-runtime plugin.
let runtimeOptions = {
  // Do not polyfill; leave that to applications.
  polyfill: false,
  // Do not import polyfills for helpers.
  useBuiltIns: true,
  // Export helpers as modules when developing.
  useESModules: process.env.BABEL_ENV === 'development',
};

// Options for the @babel/env preset.
let envOptions = {
  // Transform modules if compiling for production.
  modules: process.env.BABEL_ENV === 'production' ? 'commonjs' : false,
  // Enabled proposals that have shipped in browsers.
  shippedProposals: true,
  // Set target environments.
  targets: {
    // Browsers: > 1%, last 2 versions, Firefox ESR
    browsers: ['defaults'],
    // Node: LTS
    node: '6.0',
  },
  // Use a minimal @babel/polyfill.
  useBuiltIns: 'entry',
};

const config = {
  plugins: [
    ['@babel/transform-runtime', runtimeOptions],
  ],
  presets: [
    ['@babel/env', envOptions],
  ],
};

module.exports = config;
