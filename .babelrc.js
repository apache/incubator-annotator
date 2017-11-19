// Options for the @babel/transform-runtime plugin.
let runtimeOptions = {
  // Do not polyfill; leave that to applications.
  polyfill: false,
  // Do not import polyfills for helpers.
  useBuiltIns: true,
  // Export helpers as modules when developing.
  useESModules: process.env.BABEL_ENV === 'development',
};

// Hacks for istanbul coverage, taken from babel itself.
// See https://github.com/babel/babel/pull/6382
// This works around https://github.com/istanbuljs/istanbuljs/issues/92
function istanbulHacks() {
  return {
    inherits: require("babel-plugin-istanbul").default,
    visitor: {
      Program: {
        exit: function(path) {
          if (!this.__dv__) return

          const node = path.node.body[0];
          if (
            node.type !== "VariableDeclaration" ||
            node.declarations[0].id.type !== "Identifier" ||
            !node.declarations[0].id.name.match(/cov_/) ||
            node._blockHoist !== 3
          ) {
            throw new Error("Something has gone wrong in the istanbul hacks.");
          }

          // Gross hacks to put the code coverage block above all compiled
          // import statement output.
          node._blockHoist = 5;
        },
      },
    },
  };
}

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
    ...(process.env.BABEL_ENV !== 'production' ? ['istanbul'] : []),
  ],
  presets: [
    ['@babel/env', envOptions],
  ],
};

module.exports = config;
