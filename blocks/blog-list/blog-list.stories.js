import decorate from './blog-list.js';
import './blog-list.css';

export default {
  title: 'Blocks/Blog List',
};

// EDS hands each block a <div> whose children are authored rows, each
// tagged with data-aue-prop matching the field name from _blog-list.json.
// We build that same shape here, then call decorate() on it directly.
function buildBlock({ indexPath, limit, category }) {
  const block = document.createElement('div');
  block.className = 'blog-list block';

  const addRow = (prop, value) => {
    const row = document.createElement('div');
    row.dataset.aueProp = prop;
    row.textContent = value;
    block.append(row);
  };

  if (indexPath) addRow('indexPath', indexPath);
  if (limit) addRow('limit', String(limit));
  if (category) addRow('category', category);

  return block;
}

// Storybook has no /blog/query-index.json to fetch, so this story mocks
// window.fetch just for the preview — decorate() itself is unmodified.
function withMockedIndex(posts, render) {
  const originalFetch = window.fetch;
  window.fetch = async () => ({
    ok: true,
    json: async () => ({ data: posts }),
  });
  const block = render();
  // restore fetch shortly after so later stories aren't affected
  setTimeout(() => { window.fetch = originalFetch; }, 0);
  return block;
}

const SAMPLE_POSTS = [
  {
    path: '/blog/first-post',
    title: 'Shipping our first block',
    description: 'How we built the site with Edge Delivery Services.',
    image: '/sample-images/card1.svg',
    category: 'Engineering',
    author: 'Asha Rao',
    publishDate: '1717200000',
  },
  {
    path: '/blog/second-post',
    title: 'Designing with Universal Editor',
    description: 'A look at authoring blocks visually.',
    image: '/sample-images/card2.svg',
    category: 'Design',
    author: 'Leo Fischer',
    publishDate: '1719878400',
  },
  {
    path: '/blog/third-post',
    title: 'Why we skipped the bundler',
    description: 'Using native ES modules for React, no build step needed.',
    image: '/sample-images/card3.svg',
    category: 'Engineering',
    author: 'Priya Nair',
    publishDate: '1722556800',
  },
];

export const Default = () => withMockedIndex(SAMPLE_POSTS, () => {
  const block = buildBlock({ indexPath: '/blog/query-index.json', limit: 6 });
  decorate(block);
  return block;
});

export const FilteredByCategory = () => withMockedIndex(SAMPLE_POSTS, () => {
  const block = buildBlock({ indexPath: '/blog/query-index.json', limit: 6, category: 'Engineering' });
  decorate(block);
  return block;
});
