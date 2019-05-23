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
    ecmaVersion: '2019',
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
      'babel-module': {
        alias: {
          '^@annotator/(.+)$': '@annotator/\\1/src/index.js',
        },
      },
    },
  },
  overrides: [
    {
      files: ['.eslintrc.js', '.mocharc.js', 'babel.config.js', 'scripts/*.js'],
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
      files: ['demo/**/*.js'],
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
            allow: ['ajv/lib/refs/json-schema-draft-04.json', 'src/**'],
          },
        ],
        'import/no-relative-parent-imports': 'off',
      },
    },
  ],
};
