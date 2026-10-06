export default function decorate(block) {
  const rows = [...block.children];

  const imageRow = rows[0];
  const tagRow = rows[1];
  const headingRow = rows[2];
  const descriptionRow = rows[3];
  const buttonRow = rows[4];
  const reverseRow = rows[5];

  const image = imageRow?.querySelector('picture, img');

  const tag = tagRow?.textContent.trim();
  const heading = headingRow?.textContent.trim();

  const description = descriptionRow?.innerHTML;

  const buttonLink = buttonRow?.querySelector('a');
  const buttonText = buttonLink?.textContent.trim();
  const buttonHref = buttonLink?.href;

  const reverse = reverseRow?.textContent.trim().toLowerCase() === 'true';

  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'feature-spotlight-wrapper';

  const section = document.createElement('div');
  section.className = 'feature-spotlight';

  if (reverse) {
    section.classList.add('reverse');
  }

  /* Image */
  const imageContainer = document.createElement('div');
  imageContainer.className = 'feature-image';

  if (image) {
    if (image.tagName === 'PICTURE') {
      imageContainer.appendChild(image);
    } else {
      const picture = document.createElement('picture');
      picture.appendChild(image);
      imageContainer.appendChild(picture);
    }
  }

  /* Content */
  const content = document.createElement('div');
  content.className = 'feature-content';

  if (tag) {
    const tagElement = document.createElement('div');
    tagElement.className = 'feature-tag';
    tagElement.textContent = tag;
    content.appendChild(tagElement);
  }

  if (heading) {
    const headingElement = document.createElement('h2');
    headingElement.textContent = heading;
    content.appendChild(headingElement);
  }

  if (description) {
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'feature-description';
    descriptionElement.innerHTML = description;
    content.appendChild(descriptionElement);
  }

  if (buttonLink && buttonText && buttonHref) {
    const button = document.createElement('a');

    button.className = 'feature-button';
    button.href = buttonHref;
    button.textContent = buttonText;

    content.appendChild(button);
  }

  section.appendChild(imageContainer);
  section.appendChild(content);

  wrapper.appendChild(section);
  block.appendChild(wrapper);
}
