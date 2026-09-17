import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /*
   * Card item structure (fields in model order - each is its own cell):
   *
   * [0] Image
   * [1] Title
   * [2] Description
   * [3] Link (URL)
   * [4] Link Text
   */

  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const [
      imageWrapper,
      titleWrapper,
      descriptionWrapper,
      linkWrapper,
      linkTextWrapper,
    ] = row.children;

    if (imageWrapper) {
      imageWrapper.className = 'cards-card-image';
      li.append(imageWrapper);
    }

    const body = document.createElement('div');
    body.className = 'cards-card-body';

    if (titleWrapper) {
      titleWrapper.className = 'cards-card-title';
      body.append(titleWrapper);
    }

    if (descriptionWrapper) {
      descriptionWrapper.className = 'cards-card-description';
      body.append(descriptionWrapper);
    }

    // the Link and Link Text fields are authored as two separate cells;
    // merge them into a single styled link.
    const anchor = linkWrapper?.querySelector('a');
    const href = anchor?.getAttribute('href');
    if (href) {
      const label = linkTextWrapper?.textContent.trim() || anchor.textContent.trim() || href;
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.className = 'cards-card-link button';

      const linkContainer = document.createElement('div');
      linkContainer.className = 'cards-card-link-wrapper';
      linkContainer.append(link);
      body.append(linkContainer);
    }

    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
