export default function decorate(block) {
  block.classList.add('article-meta');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`article-meta-${prop}`);
  });
}
