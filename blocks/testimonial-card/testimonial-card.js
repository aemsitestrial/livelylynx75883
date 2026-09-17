import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const photoRow = block.querySelector('[data-aue-prop="photo"]');
  const quoteRow = block.querySelector('[data-aue-prop="quote"]');
  const nameRow = block.querySelector('[data-aue-prop="name"]');
  const roleRow = block.querySelector('[data-aue-prop="role"]');

  const wrapper = document.createElement('div');
  wrapper.className = 'testimonial-card-wrapper';

  const photoPicture = photoRow?.querySelector('picture');
  const photoLink = photoRow?.querySelector('a');

  if (photoPicture) {
    // If AEM rendered it natively as a <picture>
    const photo = document.createElement('div');
    photo.className = 'testimonial-card-photo';
    photo.append(photoPicture); // Directly append the picture tag
    moveInstrumentation(photoRow, photo);
    wrapper.append(photo);
  } else if (photoLink) {
    // Fallback: If it was authored as a link <a>
    const photo = document.createElement('div');
    photo.className = 'testimonial-card-photo';
    const img = document.createElement('img');
    img.src = photoLink.href;
    img.alt = photoLink.title || '';
    photo.append(img);
    moveInstrumentation(photoRow, photo);
    wrapper.append(photo);
  }

  if (quoteRow && quoteRow.textContent.trim()) {
    const quote = document.createElement('blockquote');
    quote.className = 'testimonial-card-quote';
    quote.innerHTML = quoteRow.innerHTML;
    moveInstrumentation(quoteRow, quote);
    wrapper.append(quote);
  }

  if (nameRow?.textContent.trim() || roleRow?.textContent.trim()) {
    const attribution = document.createElement('div');
    attribution.className = 'testimonial-card-attribution';

    if (nameRow?.textContent.trim()) {
      const name = document.createElement('p');
      name.className = 'testimonial-card-name';
      name.textContent = nameRow.textContent.trim();
      moveInstrumentation(nameRow, name);
      attribution.append(name);
    }

    if (roleRow?.textContent.trim()) {
      const role = document.createElement('p');
      role.className = 'testimonial-card-role';
      role.textContent = roleRow.textContent.trim();
      moveInstrumentation(roleRow, role);
      attribution.append(role);
    }

    wrapper.append(attribution);
  }

  block.textContent = '';
  block.append(wrapper);
}
