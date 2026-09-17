export default function decorate(block) {
  block.classList.add('event-card');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`event-card-${prop}`);
  });
}
