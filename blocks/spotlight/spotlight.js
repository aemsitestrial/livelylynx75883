export default function decorate(block) {
  const rows = [...block.children];

  const imageRow = rows[0];
  const titleRow = rows[1];
  const descriptionRow = rows[2];
  const buttonRow = rows[3];

  const image = imageRow?.querySelector('picture, img');

  const title = titleRow?.textContent.trim();

  const description = descriptionRow?.innerHTML;

  const buttonLink = buttonRow?.querySelector('a');

  const buttonText = buttonLink?.textContent.trim();

  const buttonHref = buttonLink?.href || '#';

  /*
   * Clear original block content
   */
  block.innerHTML = '';

  /*
   * Main container
   */
  const container = document.createElement('div');
  container.className = 'spotlight-container';

  /*
   * Image section
   */
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'spotlight-image';

  if (image) {
    if (image.tagName === 'PICTURE') {
      imageWrapper.appendChild(image);
    } else {
      const picture = document.createElement('picture');
      picture.appendChild(image);
      imageWrapper.appendChild(picture);
    }
  }

  /*
   * Content section
   */
  const content = document.createElement('div');
  content.className = 'spotlight-content';

  /*
   * Title
   */
  if (title) {
    const heading = document.createElement('h2');

    heading.textContent = title;

    content.appendChild(heading);
  }

  /*
   * Description
   */
  if (description) {
    const text = document.createElement('div');

    text.className = 'spotlight-description';

    text.innerHTML = description;

    content.appendChild(text);
  }

  /*
   * Button
   */
  if (buttonText) {
    const button = document.createElement('a');

    button.className = 'spotlight-button';

    button.href = buttonHref;

    button.innerHTML = `
      <span>${buttonText}</span>
      <span class="button-arrow">→</span>
    `;

    content.appendChild(button);
  }

  /*
   * Build component
   */
  container.appendChild(imageWrapper);
  container.appendChild(content);

  block.appendChild(container);

  /*
   * IMAGE MOUSE MOVEMENT EFFECT
   */
  imageWrapper.addEventListener('mousemove', (event) => {
    const rect = imageWrapper.getBoundingClientRect();

    const x = event.clientX - rect.left;

    const y = event.clientY - rect.top;

    const moveX = (x / rect.width - 0.5) * 12;

    const moveY = (y / rect.height - 0.5) * 12;

    const img = imageWrapper.querySelector('img');

    if (img) {
      img.style.transform = `
        scale(1.08)
        translate(${moveX}px, ${moveY}px)
      `;
    }
  });

  /*
   * RESET IMAGE POSITION
   */
  imageWrapper.addEventListener('mouseleave', () => {
    const img = imageWrapper.querySelector('img');

    if (img) {
      img.style.transform = 'scale(1)';
    }
  });

  /*
   * BUTTON ARROW ANIMATION
   */
  const button = content.querySelector('.spotlight-button');

  if (button) {
    button.addEventListener('mouseenter', () => {
      button.querySelector('.button-arrow').style.transform = 'translateX(8px)';
    });

    button.addEventListener('mouseleave', () => {
      button.querySelector('.button-arrow').style.transform = 'translateX(0)';
    });
  }

  /*
   * SCROLL REVEAL
   */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    },
  );

  observer.observe(container);
}
