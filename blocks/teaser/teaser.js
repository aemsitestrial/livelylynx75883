export default function decorate(block) {
  /*
   * Teaser structure:
   *
   * [0] Image
   * [1] Title
   * [2] Body
   * [3] CTA
   *      ├── CTA Link
   *      └── CTA Text
   */

  const [imageWrapper, titleWrapper, bodyWrapper, ctaWrapper] = block.children;

  block.classList.add('teaser');

  if (imageWrapper) {
    imageWrapper.classList.add('teaser-image');
  }

  if (titleWrapper) {
    titleWrapper.classList.add('teaser-title');
  }

  if (bodyWrapper) {
    bodyWrapper.classList.add('teaser-body');
  }

  if (ctaWrapper) {
    ctaWrapper.classList.add('teaser-cta-wrapper');

    const link = ctaWrapper.querySelector('a');

    if (link) {
      link.classList.add('teaser-cta', 'button');
    }
  }
}
