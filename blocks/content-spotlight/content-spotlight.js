export default function decorate(block) {
  block.classList.add('content-spotlight');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`content-spotlight-${prop}`);
  });
}
