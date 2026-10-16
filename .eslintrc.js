module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', { js: 'always', jsx: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    'xwalk/max-cells': ['error', {
      card: 6,
      'feature-spotlight': 8,
    }],
    // every block gets one extra cell for the shared layout controls (models/_layout.json)
    'xwalk/max-cells': ['error', { '*': 5, card: 6, section: 8 }],
  },
};
