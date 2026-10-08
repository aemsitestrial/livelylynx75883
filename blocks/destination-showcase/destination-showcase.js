export default function decorate(block) {
  const [galleryRow, contentRow, tagsRow, ctasRow] = [...block.children];
  galleryRow?.classList.add('ds-gallery');
  contentRow?.classList.add('ds-content');
  tagsRow?.classList.add('ds-tags');
  ctasRow?.classList.add('ds-ctas');

  const content = contentRow?.firstElementChild;
  if (!content) return;
  const heading = content?.querySelector('h1,h2,h3,h4,h5,h6');
  heading?.classList.add('dsa-title');

  const prev = heading?.previousElementSibling;
  if (prev && prev.tagName === 'p') prev?.classList.add('dsa-eyebrow');

  // highlight
  tagsRow?.querySelectorAll('li').forEach((li) => li.classList.add('dsa-tag'));

  // buttons: a link inside <strong> is primary, inside <em> is secondary

  ctasRow?.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
    if (a.closest('strong')) a.classList.add('primary');
    else if (a.closest('em')) a.classList.add('secondary');
  });

  // hide cells the author left empty
  [galleryRow, contentRow, tagsRow, ctasRow].forEach((row) => {
    if (row && !row.textContent.trim() && !row.querySelector('img')) row.heading = true;
  });
}
