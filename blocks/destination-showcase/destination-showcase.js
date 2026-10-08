function buildList(items, className) {
  const ul = document.createElement('ul');
  ul.className = className;
  items.forEach((item) => {
    const li = document.createElement('li');
    li.append(item);
    ul.append(li);
  });
  return ul;
}

export default function decorate(block) {
  const [galleryRow, contentRow, ...ctaRows] = [...block.children];

  galleryRow?.classList.add('ds-gallery');
  contentRow?.classList.add('ds-content');
  ctaRows.forEach((row) => row.classList.add('ds-ctas'));

  // gallery: make sure the images sit in a list
  if (galleryRow && !galleryRow.querySelector('ul')) {
    const pictures = [...galleryRow.querySelectorAll('picture')];
    if (pictures.length) {
      const cell = galleryRow.firstElementChild;
      cell.textContent = '';
      cell.append(buildList(pictures, ''));
    }
  }
  galleryRow?.querySelectorAll('li').forEach((li) => li.classList.add('ds-slide'));

  // content: eyebrow, heading, highlights, description
  const content = contentRow?.firstElementChild;
  const heading = content?.querySelector('h1, h2, h3, h4, h5, h6');
  heading?.classList.add('ds-title');

  const prev = heading?.previousElementSibling;
  if (prev && prev.tagName === 'P') prev.classList.add('ds-eyebrow');

  // highlights: either a real list, or a comma-joined paragraph
  let tags = heading?.nextElementSibling;
  if (tags && tags.tagName === 'P' && tags.textContent.includes(',')) {
    const parts = tags.textContent.split(',').map((t) => t.trim()).filter(Boolean);
    const ul = document.createElement('ul');
    parts.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.append(li);
    });
    tags.replaceWith(ul);
    tags = ul;
  }
  if (tags && tags.tagName === 'UL') {
    tags.classList.add('ds-tags');
    tags.querySelectorAll('li').forEach((li) => li.classList.add('ds-tag'));
  }

  // buttons
  block.querySelectorAll('.ds-ctas a').forEach((a) => {
    a.classList.add('button');
    if (a.closest('strong')) a.classList.add('primary');
    else if (a.closest('em')) a.classList.add('secondary');
  });

  // hide rows the author left empty
  [galleryRow, contentRow, ...ctaRows].forEach((row) => {
    if (row && !row.textContent.trim() && !row.querySelector('img')) row.hidden = true;
  });
}
