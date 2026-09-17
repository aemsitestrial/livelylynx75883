export default function decorate(block) {
  block.classList.add('product-feature');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`product-feature-${prop}`);
  });
}
