export default function decorate(block) {
  const [galleryRow, contentRow, ctasRow] = [...block.children];

  galleryRow?.classList.add('ds-gallery');
  contentRow?.classList.add('ds-content');
  ctasRow?.classList.add('ds-ctas');

  const content = contentRow?.firstElementChild;
  const heading = content?.querySelector('h1, h2, h3, h4, h5, h6');
  heading?.classList.add('ds-title');

  const prev = heading?.previousElementSibling;
  if (prev && prev.tagName === 'P') prev.classList.add('ds-eyebrow');

  // highlights: the list directly after the heading
  const tags = heading?.nextElementSibling;
  if (tags && tags.tagName === 'UL') {
    tags.classList.add('ds-tags');
    tags.querySelectorAll('li').forEach((li) => li.classList.add('ds-tag'));
  }

  ctasRow?.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
    if (a.closest('strong')) a.classList.add('primary');
    else if (a.closest('em')) a.classList.add('secondary');
  });

  [galleryRow, contentRow, ctasRow].forEach((row) => {
    if (row && !row.textContent.trim() && !row.querySelector('img')) row.hidden = true;
  });
}
