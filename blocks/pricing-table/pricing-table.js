export default function decorate(block) {
  block.classList.add('pricing-table');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`pricing-table-${prop}`);
  });
}
