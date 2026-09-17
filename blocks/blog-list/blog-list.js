/*
 * Blog List block — React-powered, no build step required.
 *
 * This project loads blocks with a native browser import() (see
 * scripts/aem.js loadBlock()) and has no webpack/esbuild step for blocks.
 * So instead of compiling JSX, we load React from a CDN as a native ES
 * module and use htm (tagged template literals) to write JSX-like markup
 * that compiles to React.createElement() calls at runtime — no build step.
 */
// eslint-disable-next-line import/no-unresolved, import/extensions
import React from 'https://esm.sh/react@18.3.1';
// eslint-disable-next-line import/no-unresolved, import/extensions
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
// eslint-disable-next-line import/no-unresolved, import/extensions
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);

function formatDate(value) {
  if (!value) return '';
  // Helix query-index dates are usually unix seconds; fall back to ISO strings.
  const ts = (/^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value));
  if (Number.isNaN(ts)) return '';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function BlogCard({ post }) {
  return html`
    <a class="blog-list-card" href=${post.path}>
      ${post.image ? html`<img class="blog-list-card-image" src=${post.image} alt="" loading="lazy" />` : null}
      <div class="blog-list-card-body">
        ${post.category ? html`<p class="blog-list-card-category">${post.category}</p>` : null}
        <h3 class="blog-list-card-title">${post.title}</h3>
        <p class="blog-list-card-description">${post.description}</p>
        <p class="blog-list-card-meta">
          ${post.author ? html`<span>${post.author}</span>` : null}
          ${post.publishDate ? html`<span> · ${formatDate(post.publishDate)}</span>` : null}
        </p>
      </div>
    </a>
  `;
}

function BlogList({ indexPath, limit, category }) {
  const [state, setState] = React.useState({ status: 'loading', posts: [] });

  React.useEffect(() => {
    let cancelled = false;

    fetch(indexPath)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        let posts = json.data || [];
        if (category) {
          posts = posts.filter(
            (p) => (p.category || '').toLowerCase() === category.toLowerCase(),
          );
        }
        posts = posts
          .slice()
          .sort((a, b) => (Number(b.publishDate) || 0) - (Number(a.publishDate) || 0))
          .slice(0, limit);
        setState({ status: 'ready', posts });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', posts: [] });
      });

    return () => { cancelled = true; };
  }, [indexPath, limit, category]);

  if (state.status === 'loading') return html`<p class="blog-list-status">Loading posts…</p>`;
  if (state.status === 'error') return html`<p class="blog-list-status">Unable to load posts right now.</p>`;
  if (state.posts.length === 0) return html`<p class="blog-list-status">No posts found.</p>`;

  return html`
    <div class="blog-list-grid">
      ${state.posts.map((post) => html`<${BlogCard} key=${post.path} post=${post} />`)}
    </div>
  `;
}

export default function decorate(block) {
  // Authored fields come in as rows tagged with data-aue-prop, same
  // technique used in blocks/article-meta/article-meta.js.
  const fields = {};
  [...block.children].forEach((row) => {
    const prop = row.dataset.aueProp;
    if (prop) fields[prop] = row.textContent.trim();
  });

  const indexPath = fields.indexPath || '/blog/query-index.json';
  const limit = parseInt(fields.limit, 10) || 6;
  const category = fields.category || '';

  block.textContent = '';
  const mount = document.createElement('div');
  block.append(mount);

  const root = createRoot(mount);
  root.render(html`<${BlogList} indexPath=${indexPath} limit=${limit} category=${category} />`);
}
