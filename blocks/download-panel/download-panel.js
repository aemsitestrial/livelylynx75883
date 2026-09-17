export default function decorate(block) {
  block.classList.add('download-panel');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`download-panel-${prop}`);
  });
}
