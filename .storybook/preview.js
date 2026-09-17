// Load the same global styles EDS applies on the real site, so blocks
// look right inside Storybook too.
import '../styles/styles.css';
import '../styles/fonts.css';

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
