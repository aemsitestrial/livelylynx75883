export default function decorate(block) {
  block.classList.add('media-gallery');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`media-gallery-${prop}`);
  });
}
