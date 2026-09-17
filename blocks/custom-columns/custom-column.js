export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`custom-columns-${cols.length}-cols`);

  const isTextCta = block.classList.contains('text-cta');

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('custom-columns-img-col');
        }
      }

      if (isTextCta) {
        const link = col.querySelector('a');
        if (link && !link.classList.contains('button')) {
          link.classList.add('button');
          link.closest('p')?.classList.add('button-container');
        }
      }
    });
  });
}
