// export default function decorate(block) {
//   const columns = [...block.firstElementChild.children];

//   // --------------------------------
//   // COLUMN 1: LOGO
//   // --------------------------------

//   const logoColumn = columns[0];

//   logoColumn.classList.add('header-infodales-logo');

//   // --------------------------------
//   // COLUMN 2: NAVIGATION
//   // --------------------------------

//   const navColumn = columns[1];

//   navColumn.classList.add('header-infodales-navigation');

//   const nav = document.createElement('nav');
//   nav.setAttribute('aria-label', 'Primary navigation');

//   const navList = document.createElement('ul');

//   const links = [...navColumn.querySelectorAll('a')];

//   // Object used to group dropdown items
//   const navigationItems = {};

//   links.forEach((link) => {
//     const text = link.textContent.trim();

//     // Dropdown format:
//     // Services|Consulting
//     // Services|Development

//     if (text.includes('|')) {
//       const [parent, child] = text.split('|');

//       if (!navigationItems[parent]) {
//         navigationItems[parent] = {
//           parent,
//           href: '#',
//           children: [],
//         };
//       }

//       navigationItems[parent].children.push({
//         text: child.trim(),
//         href: link.href,
//       });
//     } else {
//       navigationItems[text] = {
//         parent: text,
//         href: link.href,
//         children: [],
//       };
//     }
//   });

//   // Create navigation HTML
//   Object.values(navigationItems).forEach((item) => {
//     const li = document.createElement('li');

//     li.className = 'header-infodales-nav-item';

//     const link = document.createElement('a');

//     link.href = item.href;
//     link.textContent = item.parent;

//     li.append(link);

//     // --------------------------------
//     // DROPDOWN NAVIGATION
//     // --------------------------------

//     if (item.children.length > 0) {
//       li.classList.add('has-dropdown');

//       const toggle = document.createElement('button');

//       toggle.className = 'header-infodales-dropdown-toggle';

//       toggle.type = 'button';

//       toggle.setAttribute(
//         'aria-label',
//         `Open ${item.parent} menu`,
//       );

//       toggle.setAttribute(
//         'aria-expanded',
//         'false',
//       );

//       toggle.innerHTML = '⌄';

//       li.append(toggle);

//       const dropdown = document.createElement('ul');

//       dropdown.className = 'header-infodales-dropdown';

//       item.children.forEach((child) => {
//         const dropdownItem = document.createElement('li');

//         const dropdownLink = document.createElement('a');

//         dropdownLink.href = child.href;

//         dropdownLink.textContent = child.text;

//         dropdownItem.append(dropdownLink);

//         dropdown.append(dropdownItem);
//       });

//       li.append(dropdown);

//       // Dropdown toggle
//       toggle.addEventListener('click', () => {
//         const isOpen = li.classList.toggle('dropdown-open');

//         toggle.setAttribute(
//           'aria-expanded',
//           isOpen,
//         );
//       });
//     }

//     navList.append(li);
//   });

//   nav.append(navList);

//   // Replace navigation column content
//   navColumn.innerHTML = '';

//   navColumn.append(nav);

//   // --------------------------------
//   // COLUMN 3: SEARCH
//   // --------------------------------

//   const searchColumn = columns[2];

//   searchColumn.classList.add('header-infodales-search');

//   const searchButton = document.createElement('button');

//   searchButton.type = 'button';

//   searchButton.className = 'header-infodales-search-button';

//   searchButton.setAttribute(
//     'aria-label',
//     'Open search',
//   );

//   searchButton.innerHTML = `
//     <span class="header-infodales-search-icon"></span>
//   `;

//   searchColumn.innerHTML = '';

//   searchColumn.append(searchButton);

//   // --------------------------------
//   // SEARCH FUNCTIONALITY
//   // --------------------------------

//   searchButton.addEventListener('click', () => {
//     let searchPanel = document.querySelector(
//       '.header-infodales-search-panel',
//     );

//     if (!searchPanel) {
//       searchPanel = document.createElement('div');

//       searchPanel.className = 'header-infodales-search-panel';

//       searchPanel.innerHTML = `
//         <div class="header-infodales-search-content">

//           <input
//             type="search"
//             placeholder="Search..."
//             aria-label="Search"
//           >

//           <button
//             type="button"
//             class="header-infodales-search-close"
//             aria-label="Close search"
//           >
//             ×
//           </button>

//         </div>
//       `;

//       document.body.append(searchPanel);

//       const closeButton = searchPanel.querySelector(
//         '.header-infodales-search-close',
//       );

//       closeButton.addEventListener(
//         'click',
//         () => {
//           searchPanel.classList.remove('active');
//         },
//       );
//     }

//     searchPanel.classList.add('active');

//     searchPanel
//       .querySelector('input')
//       .focus();
//   });

//   // --------------------------------
//   // COLUMN 4: MOBILE HAMBURGER
//   // --------------------------------

//   const menuColumn = columns[3];

//   menuColumn.classList.add('header-infodales-menu');

//   const menuButton = document.createElement('button');

//   menuButton.type = 'button';

//   menuButton.className = 'header-infodales-menu-button';

//   menuButton.setAttribute(
//     'aria-label',
//     'Open navigation menu',
//   );

//   menuButton.setAttribute(
//     'aria-expanded',
//     'false',
//   );

//   menuButton.innerHTML = `
//     <span></span>
//     <span></span>
//     <span></span>
//   `;

//   menuColumn.innerHTML = '';

//   menuColumn.append(menuButton);

//   // --------------------------------
//   // MOBILE MENU
//   // --------------------------------

//   menuButton.addEventListener('click', () => {
//     const isOpen = navColumn.classList.toggle(
//       'mobile-menu-open',
//     );

//     menuButton.classList.toggle(
//       'active',
//     );

//     menuButton.setAttribute(
//       'aria-expanded',
//       isOpen,
//     );
//   });
// }
// import { moveInstrumentation } from '../../scripts/scripts.js';

// const isDesktop = window.matchMedia('(min-width: 900px)');

// function toggleAllDropdowns(nav, expanded = false) {
//   nav.querySelectorAll(':scope > ul > li[aria-haspopup="true"]').forEach((li) => {
//     li.setAttribute('aria-expanded', expanded);
//   });
// }

// function toggleMenu(navWrapper, forceExpanded = null) {
//   const expanded = forceExpanded !== null
//     ? !forceExpanded
//     : navWrapper.getAttribute('aria-expanded') === 'true';
//   navWrapper.setAttribute('aria-expanded', expanded ? 'false' : 'true');
//   document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
// }

// export default function decorate(block) {
//   const rows = [...block.children];
//   const [logoRow, navRow, footerLinksRow, copyrightRow] = rows;

//   const logoPic = logoRow?.querySelector('picture');
//   const navList = navRow?.querySelector('ul');
//   const footerLinksList = footerLinksRow?.querySelector('ul');
//   const copyrightText = copyrightRow?.textContent?.trim() || '';

//   const wrapper = document.createElement('div');
//   wrapper.className = 'header-infodales-wrapper';

//   // ---------------- HEADER ----------------
//   const header = document.createElement('div');
//   header.className = 'header-infodales-header';

//   const navWrapper = document.createElement('div');
//   navWrapper.className = 'header-infodales-nav-wrapper';
//   navWrapper.setAttribute('aria-expanded', 'false');

//   // Logo
//   const brand = document.createElement('div');
//   brand.className = 'header-infodales-brand';
//   if (logoPic) {
//     const link = document.createElement('a');
//     link.href = '/';
//     link.setAttribute('aria-label', 'Home');
//     link.append(logoPic);
//     if (logoRow) moveInstrumentation(logoRow, brand);
//     brand.append(link);
//   }

//   // Primary + dropdown navigation
//   const nav = document.createElement('nav');
//   nav.className = 'header-infodales-nav';
//   nav.setAttribute('aria-label', 'Primary');
//   if (navList) {
//     if (navRow) moveInstrumentation(navRow, nav);
//     nav.append(navList);
//     navList.querySelectorAll(':scope > li').forEach((li) => {
//       const submenu = li.querySelector('ul');
//       if (submenu) {
//         li.setAttribute('aria-haspopup', 'true');
//         li.setAttribute('aria-expanded', 'false');
//         li.addEventListener('click', () => {
//           if (isDesktop.matches) {
//             const expanded = li.getAttribute('aria-expanded') === 'true';
//             toggleAllDropdowns(nav);
//             li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
//           }
//         });
//       }
//     });
//   }

//   // Search icon (static UI, not an authored field)
//   const tools = document.createElement('div');
//   tools.className = 'header-infodales-tools';
//   const searchBtn = document.createElement('button');
//   searchBtn.type = 'button';
//   searchBtn.className = 'header-infodales-search';
//   searchBtn.setAttribute('aria-label', 'Search');
//   searchBtn.innerHTML = '<img src="/icons/search.svg" alt="" loading="lazy">';
//   tools.append(searchBtn);

//   // Mobile hamburger
//   const hamburger = document.createElement('button');
//   hamburger.type = 'button';
//   hamburger.className = 'header-infodales-hamburger';
//   hamburger.setAttribute('aria-label', 'Open navigation');
//   hamburger.innerHTML = '<span class="header-infodales-hamburger-icon"></span>';
//   hamburger.addEventListener('click', () => toggleMenu(navWrapper));

//   navWrapper.append(hamburger, brand, nav, tools);
//   header.append(navWrapper);

//   isDesktop.addEventListener('change', () => navWrapper.setAttribute('aria-expanded', 'false'));

//   // ---------------- FOOTER ----------------
//   const footer = document.createElement('div');
//   footer.className = 'header-infodales-footer';

//   if (footerLinksList) {
//     footerLinksList.classList.add('header-infodales-footer-links');
//     if (footerLinksRow) moveInstrumentation(footerLinksRow, footerLinksList);
//     footer.append(footerLinksList);
//   }

//   if (copyrightText) {
//     const p = document.createElement('p');
//     p.className = 'header-infodales-copyright';
//     p.textContent = copyrightText;
//     if (copyrightRow) moveInstrumentation(copyrightRow, p);
//     footer.append(p);
//   }

//   wrapper.append(header, footer);
//   moveInstrumentation(block, wrapper);
//   block.replaceChildren(wrapper);
// }
