export default function decorate(block) {
  block.classList.add('author-profile');
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) row.classList.add(`author-profile-${prop}`);
  });
}
