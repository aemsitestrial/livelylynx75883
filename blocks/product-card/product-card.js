export default function decorate(block) {
  const rows = [...block.children];

  const imageRow = rows[0];
  const nameRow = rows[1];
  const descriptionRow = rows[2];
  const buttonRow = rows[3];

  // Get author content
  const image = imageRow?.querySelector('picture, img');
  const productName = nameRow?.textContent.trim();
  const description = descriptionRow?.innerHTML;
  const buttonText = buttonRow?.textContent.trim();

  // Clear original block
  block.innerHTML = '';

  // Main card
  const card = document.createElement('div');
  card.className = 'product-card';

  // Image
  if (image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'product-card-image';

    if (image.tagName === 'PICTURE') {
      imageWrapper.appendChild(image);
    } else {
      const picture = document.createElement('picture');
      picture.appendChild(image);
      imageWrapper.appendChild(picture);
    }

    card.appendChild(imageWrapper);
  }

  // Content
  const content = document.createElement('div');
  content.className = 'product-card-content';

  // Product name
  if (productName) {
    const heading = document.createElement('h2');
    heading.textContent = productName;
    content.appendChild(heading);
  }

  // Description
  if (description) {
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'product-card-description';
    descriptionElement.innerHTML = description;
    content.appendChild(descriptionElement);
  }

  // CTA button
  if (buttonText) {
    const button = document.createElement('button');
    button.className = 'product-card-button';
    button.textContent = buttonText;

    content.appendChild(button);

    // Button interaction
    button.addEventListener('click', () => {
      button.classList.add('clicked');

      setTimeout(() => {
        button.classList.remove('clicked');
      }, 300);
    });
  }

  card.appendChild(content);
  block.appendChild(card);

  // Card hover effect
  card.addEventListener('mouseenter', () => {
    card.classList.add('active');
  });

  card.addEventListener('mouseleave', () => {
    card.classList.remove('active');
  });
}
