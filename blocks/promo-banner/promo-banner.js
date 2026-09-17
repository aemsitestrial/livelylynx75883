export default function decorate(block) {
  block.classList.add('promo-banner');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`promo-banner-${prop}`);
  });
}
