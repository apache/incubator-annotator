const path = require('path');

const babel = require('@babel/core');

// Use the root babel.config.js for module resolution.
// Relevant issue: tleunen/eslint-import-resolver-babel-module#89
const babelOptions = babel.loadOptions({ cwd: __dirname });
const babelModuleResolver = babelOptions.plugins.find(
  ({ key }) => key === 'module-resolver',
);

module.exports = {
  root: true,
  env: {
    es6: true,
    'shared-node-browser': true,
  },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  globals: {
    globalThis: true,
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['import', 'prettier'],
  rules: {
    'import/extensions': ['error', 'always', { ignorePackages: true }],
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-default-export': 'error',
    'import/no-internal-modules': 'error',
    'import/no-relative-parent-imports': 'error',
    'import/order': ['error', { 'newlines-between': 'always' }],
    'import/unambiguous': 'error',
    'no-restricted-syntax': [
      'error',
      'BindExpression',
      'ClassProperty',
      'Decorator',
      'DoExpression',
      'ExportDefaultSpecifier',
      'ExportNamespaceSpecifier',
      'TypeAnnotation',
      'JSXElement',
    ],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
  },
  settings: {
    'import/resolver': {
      'babel-module': babelModuleResolver.options,
    },
  },
  overrides: [
    {
      files: [
        '.eslintrc.js',
        '.mocharc.js',
        'babel.config.js',
        'nyc.config.js',
      ],
      env: {
        node: true,
      },
      parser: 'espree',
      parserOptions: {
        sourceType: 'script',
      },
      plugins: ['node'],
      rules: {
        'no-console': 'off',
        'node/no-unsupported-features': 'error',
      },
    },
    {
      files: ['web/demo/**/*.js'],
      env: {
        browser: true,
      },
    },
    {
      files: ['packages/*/test/**/*.js', 'test/**/*.js'],
      env: {
        mocha: true,
      },
      globals: {
        assert: true,
      },
      rules: {
        'import/no-internal-modules': [
          'error',
          {
            allow: [
              'ajv/lib/refs/json-schema-draft-04.json',
              path.resolve(__dirname, './packages/*/src/**'),
            ],
          },
        ],
        'import/no-relative-parent-imports': 'off',
      },
    },
  ],
};
