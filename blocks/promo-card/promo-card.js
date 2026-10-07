export default function decorate(block) {
  const [imageRow, contentRow] = [...block.children];

  imageRow?.classList.add('promo-card-image');
  contentRow?.classList.add('promo-card-body');

  // all content_* fields land in one cell: eyebrow, heading, description, CTA
  const content = contentRow?.firstElementChild;

  if (!content) return;

  const heading = content.querySelector('h1,h2,h3,h4,h5,h6');
  const link = content.querySelector('a');
  const ctaWrapper = link?.closest('p');

  heading?.classList.add('promo-card-title');
  ctaWrapper?.classList.add('promo-card-cta');

  // eyebrow = a paragraph sitting directly before the heading
  const prev = heading?.previousElementSibling;
  if (prev && prev.tagName === 'p') prev.classList.add('promo-card-eyebrow');

  // description = every element after the heading, except the CTA
  let sibling = heading?.nextElementSibling;
  while (sibling) {
    if (sibling !== ctaWrapper) sibling.classList.add('promo-card-description');
    sibling = sibling.nextElementSibling;
  }

  // hide empty rows (e.g. no image authored) so they don't leave gaps
  [imageRow, contentRow].forEach((row) => {
    if (row && !row.textContent.trim() && !row.querySelector('img')) row.remove();
  });
}
