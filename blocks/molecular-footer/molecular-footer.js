export default function decorate(block) {
  const items = [...block.children];

  // Create footer
  const footer = document.createElement('div');
  footer.className = 'molecular-footer-wrapper';

  // Top section
  const topSection = document.createElement('div');
  topSection.className = 'molecular-footer-top';

  // Main logo section
  const mainLogoSection = document.createElement('div');
  mainLogoSection.className = 'molecular-footer-main-logo';

  // Links section
  const linksSection = document.createElement('div');
  linksSection.className = 'molecular-footer-links';

  // Divider
  const divider = document.createElement('div');
  divider.className = 'molecular-footer-divider';

  // Brand logos section
  const brandLogosSection = document.createElement('div');
  brandLogosSection.className = 'molecular-footer-brand-logos';

  items.forEach((item) => {
    const cells = [...item.children];

    /*
     * FOOTER LINK
     *
     * Fields:
     * 0 - Text
     * 1 - Link
     */
    if (cells.length === 2) {
      const text = cells[0].textContent.trim();
      const link = cells[1].textContent.trim();

      if (text && link) {
        const anchor = document.createElement('a');

        anchor.textContent = text;
        anchor.href = link;

        linksSection.append(anchor);
      }

      return;
    }

    /*
     * MAIN LOGO OR BRAND LOGO
     *
     * Fields:
     * 0 - Image
     * 1 - Alt Text
     * 2 - Link
     */
    if (cells.length === 3) {
      const image = cells[0].querySelector('img');
      const alt = cells[1].textContent.trim();
      const link = cells[2].textContent.trim();

      if (!image) return;

      image.alt = alt;

      const anchor = document.createElement('a');

      anchor.href = link || '#';
      anchor.append(image);

      /*
       * First 3-field item =
       * Main Footer Logo
       *
       * Remaining 3-field items =
       * Brand Logos
       */
      if (!mainLogoSection.children.length) {
        mainLogoSection.append(anchor);
      } else {
        brandLogosSection.append(anchor);
      }
    }
  });

  // Add logo + links to top section
  topSection.append(
    mainLogoSection,
    linksSection,
  );

  // Build final footer
  footer.append(
    topSection,
    divider,
    brandLogosSection,
  );

  // Replace authored content
  block.replaceChildren(footer);
}
