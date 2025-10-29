const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'eslint-plugin-import'],
  env: {
    browser: true,
  },
  extends: ['eslint:recommended','plugin:@typescript-eslint/recommended'],
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  ignorePatterns: ['dist', '.eslintrc.js', 'webpack.config.js'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
    'no-shadow': ['error', { builtinGlobals: false, hoist: 'functions', allow: [] }],
  }
};
