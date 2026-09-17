import decorate from './cards.js';
import './cards.css';

export default {
  title: 'Blocks/Cards',
};

// EDS hands each block a <div> whose children are "rows" (from the source
// table), and each row's children are "cells". We build that same shape
// by hand here, then call the block's own decorate() on it - exactly what
// scripts/scripts.js does on the real site.
//
// Field order per card matches the model: Image, Title, Description,
// Link (URL), Link Text - each field is its own cell.
function buildBlock(rows) {
  const block = document.createElement('div');
  block.className = 'cards block';
  rows.forEach(({
    image, title, description, linkHref, linkText,
  }) => {
    const row = document.createElement('div');

    const imgCell = document.createElement('div');
    imgCell.innerHTML = `<picture><img src="${image}" alt="${title}"></picture>`;

    const titleCell = document.createElement('div');
    titleCell.innerHTML = `<h3>${title}</h3>`;

    const descriptionCell = document.createElement('div');
    descriptionCell.innerHTML = `<p>${description}</p>`;

    row.append(imgCell, titleCell, descriptionCell);

    if (linkHref) {
      const linkCell = document.createElement('div');
      linkCell.innerHTML = `<p><a href="${linkHref}">${linkHref}</a></p>`;

      const linkTextCell = document.createElement('div');
      linkTextCell.innerHTML = `<p>${linkText || 'Learn more'}</p>`;

      row.append(linkCell, linkTextCell);
    }

    block.append(row);
  });
  return block;
}

export const Default = () => {
  const block = buildBlock([
    {
      image: '/sample-images/card1.svg',
      title: 'Card One',
      description: 'First card body text.',
      linkHref: '#',
      linkText: 'Learn more',
    },
    {
      image: '/sample-images/card2.svg',
      title: 'Card Two',
      description: 'Second card body text.',
      linkHref: '#',
      linkText: 'Learn more',
    },
    {
      image: '/sample-images/card3.svg',
      title: 'Card Three',
      description: 'Third card body text.',
      linkHref: '#',
      linkText: 'Learn more',
    },
  ]);
  decorate(block);
  return block;
};

// Confirms the grid collapses to a single column below the 900px
// breakpoint defined in cards.css - resize the Storybook canvas/viewport
// to check both layouts.
export const SixCardsResponsiveGrid = () => {
  const block = buildBlock([
    {
      image: '/sample-images/card1.svg', title: 'Card One', description: 'First card body text.', linkHref: '#', linkText: 'Learn more',
    },
    {
      image: '/sample-images/card2.svg', title: 'Card Two', description: 'Second card body text.', linkHref: '#', linkText: 'Learn more',
    },
    {
      image: '/sample-images/card3.svg', title: 'Card Three', description: 'Third card body text.', linkHref: '#', linkText: 'Learn more',
    },
    {
      image: '/sample-images/card1.svg', title: 'Card Four', description: 'Fourth card body text.', linkHref: '#', linkText: 'Learn more',
    },
    {
      image: '/sample-images/card2.svg', title: 'Card Five', description: 'Fifth card body text.', linkHref: '#', linkText: 'Learn more',
    },
    {
      image: '/sample-images/card3.svg', title: 'Card Six', description: 'Sixth card body text.', linkHref: '#', linkText: 'Learn more',
    },
  ]);
  decorate(block);
  return block;
};

export const SingleCard = () => {
  const block = buildBlock([
    {
      image: '/sample-images/card1.svg',
      title: 'Only Card',
      description: 'Just one card here.',
      linkHref: '#',
      linkText: 'Learn more',
    },
  ]);
  decorate(block);
  return block;
};

export const NoLink = () => {
  const block = buildBlock([
    { image: '/sample-images/card1.svg', title: 'Card One', description: 'No link on this card.' },
    { image: '/sample-images/card2.svg', title: 'Card Two', description: 'No link on this card either.' },
  ]);
  decorate(block);
  return block;
};
