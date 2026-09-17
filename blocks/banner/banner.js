import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const [imageRow, textRow, buttonRow] = rows;

  block.classList.add('banner');

  if (imageRow) {
    const img = imageRow.querySelector('img');
    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, true, [{ width: '1200' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture')?.replaceWith(optimizedPic);
    }
    imageRow.className = 'banner-image';
  }

  if (textRow) {
    textRow.className = 'banner-content';
  }

  if (buttonRow) {
    buttonRow.className = 'banner-cta';
  }

  block.replaceChildren(...rows.filter(Boolean));
}
