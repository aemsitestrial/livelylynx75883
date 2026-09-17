export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  const colCount = cols.length;
  block.classList.add(`columns-${colCount}-cols`);
  block.dataset.columns = colCount;

  const isTextCta = block.classList.contains('text-cta');

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }

      // Text + CTA variant: style buttons distinctly if not already handled
      if (isTextCta) {
        const link = col.querySelector('a.button, a');
        if (link && !link.classList.contains('button')) {
          link.classList.add('button');
          link.closest('p')?.classList.add('button-container');
        }
      }
    });
  });
}
