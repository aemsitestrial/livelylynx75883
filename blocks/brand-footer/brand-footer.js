import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const items = [...block.children];

  const wrapper = document.createElement('div');
  wrapper.className = 'brand-footer-wrapper';

  const linksRow = document.createElement('div');
  linksRow.className = 'brand-footer-links';

  const divider = document.createElement('div');
  divider.className = 'brand-footer-divider';

  const logosRow = document.createElement('div');
  logosRow.className = 'brand-footer-logos';

  items.forEach((item) => {
    const cells = [...item.children];
    if (cells.length === 3 && !cells[0].querySelector('img, picture')) {
      const text = cells[0].textContent.trim();
      const link = cells[1].textContent.trim();
      const external = cells[2].textContent.trim().toLowerCase() === 'true';

      if (text && link) {
        const anchor = document.createElement('a');
        anchor.textContent = text;
        anchor.href = link;
        if (external) {
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.classList.add('brand-footer-link-external');
        }
        moveInstrumentation(item, anchor);
        linksRow.append(anchor);
      }
      return;
    }

    /*
     * PARTNER LOGO
     * Fields: 0 - Image, 1 - Alt Text, 2 - Link (optional)
     */
    const image = cells[0]?.querySelector('img');
    if (!image) return;

    const alt = cells[1]?.textContent.trim() || '';
    const link = cells[2]?.textContent.trim() || '';
    image.alt = alt;

    let logoEl = image;
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.append(image);
      logoEl = anchor;
    }
    moveInstrumentation(item, logoEl);
    logosRow.append(logoEl);
  });

  wrapper.append(linksRow, divider, logosRow);
  moveInstrumentation(block, wrapper);
  block.replaceChildren(wrapper);
}
