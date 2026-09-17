import { mountSlider } from './slider.bundle.js';

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')].filter(
    (el) => !el.classList.contains('slider-react-root'),
  );

  const slides = rows.map((row) => {
    const [imageCell, titleCell, descCell] = row.children;
    const img = imageCell?.querySelector('img');
    return {
      image: img?.src || '',
      title: titleCell?.textContent.trim() || '',
      description: descCell?.textContent.trim() || '',
    };
  });

  rows.forEach((row) => {
    row.classList.add('slider-authoring-source');
  });

  let reactContainer = block.querySelector('.slider-react-root');
  if (!reactContainer) {
    reactContainer = document.createElement('div');
    reactContainer.className = 'slider-react-root';
    block.append(reactContainer);
  }

  mountSlider(reactContainer, slides);
}
