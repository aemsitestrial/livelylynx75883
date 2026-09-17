/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  // Look for *.stories.js next to each block's block.js / block.css
  stories: ['../blocks/**/*.stories.js'],

  addons: [
    '@storybook/addon-essentials',
  ],

  framework: {
    name: '@storybook/html-vite',
    options: {},
  },

  // EDS blocks are plain ES modules - no extra webpack/babel config needed,
  // Vite handles them as-is.
};

export default config;
