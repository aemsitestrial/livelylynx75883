/*
 * Visual layout editor: select a block on the page, drag its edges to resize it,
 * drag the grip to move it, and pick columns for its section.
 *
 * Turn it on by adding ?layout-edit=on to any page URL (?layout-edit=off turns it off).
 * Changes are saved as a draft in this browser. "Download" exports
 * layout-overrides.json - commit that file to the repo root and every visitor sees the layout.
 */
import { loadCSS } from './aem.js';

const DRAFT_KEY = 'layout-editor-draft';
const FLAG_KEY = 'layout-editor-on';
const MIN_WIDTH = 10; // percent of the section content width
const MIN_HEIGHT = 40; // px

const pagePath = () => window.location.pathname.replace(/\.html$/, '') || '/';

const read = (storage, key) => {
  try {
    return JSON.parse(storage.getItem(key)) || {};
  } catch (e) {
    return {};
  }
};

const write = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // storage can be blocked, the editor still works for this visit
  }
};

const emptyState = () => ({ blocks: {}, sections: {}, order: {} });

let main;
let state = emptyState();
let fileOverrides = {};

const sections = () => [...main.children].filter((el) => el.classList.contains('section'));
const topBlocks = () => [...main.querySelectorAll('.block')].filter((b) => !b.parentElement.closest('.block'));
const blockOf = (id) => main.querySelector(`[data-le-id="${id}"] > .block, .block[data-le-id="${id}"]`);

/** give every block (and default-content wrapper) a stable id */
function tagElements() {
  const counts = {};
  topBlocks().forEach((block) => {
    const name = block.dataset.blockName || 'block';
    counts[name] = (counts[name] || 0) + 1;
    block.parentElement.dataset.leId = `${name}-${counts[name]}`;
  });
  sections().forEach((section) => {
    section.querySelectorAll(':scope > .default-content-wrapper').forEach((wrapper, i) => {
      wrapper.dataset.leId = `text-${i + 1}`;
    });
  });
}

function applyBlock(block, cfg = {}) {
  const set = (name, prop, value, unit) => {
    if (value) {
      block.dataset[name] = value;
      if (prop) block.style.setProperty(prop, `${value}${unit}`);
    } else {
      delete block.dataset[name];
      if (prop) block.style.removeProperty(prop);
    }
  };
  set('leW', '--le-w', cfg.w, '%');
  set('leH', '--le-h', cfg.h, 'px');
  set('leAlign', null, cfg.align, '');
}

function applySection(section, cols) {
  if (section.dataset.leOrigLayout === undefined) {
    section.dataset.leOrigLayout = section.dataset.layout || '';
  }
  const layout = cols > 1 ? `columns-${cols}` : section.dataset.leOrigLayout;
  if (cols) {
    if (layout) section.dataset.layout = layout;
    else delete section.dataset.layout;
  }
}

function applyState() {
  Object.entries(state.order).forEach(([index, ids]) => {
    const section = sections()[index];
    if (!section) return;
    ids.forEach((id) => {
      const el = main.querySelector(`[data-le-id="${id}"]`);
      if (el) section.append(el);
    });
  });
  Object.entries(state.blocks).forEach(([id, cfg]) => {
    const block = blockOf(id);
    if (block) applyBlock(block, cfg);
  });
  Object.entries(state.sections).forEach(([index, cfg]) => {
    const section = sections()[index];
    if (section && cfg.cols) applySection(section, cfg.cols);
  });
}

const saveDraft = () => {
  const draft = read(localStorage, DRAFT_KEY);
  draft[pagePath()] = state;
  write(localStorage, DRAFT_KEY, draft);
};

/* ---------------------------------------------------------------- editor UI */

let selected = null; // the selected block element
let overlay;
let bar;
let toolbar;
let dragging = false;

const wrapperOf = (block) => block.parentElement;
const idOf = (block) => wrapperOf(block).dataset.leId;
const sectionOf = (block) => block.closest('.section');

function blockState(block) {
  const id = idOf(block);
  state.blocks[id] = state.blocks[id] || {};
  return state.blocks[id];
}

function setBlock(block, changes) {
  const cfg = Object.assign(blockState(block), changes);
  Object.keys(cfg).forEach((k) => !cfg[k] && delete cfg[k]);
  applyBlock(block, cfg);
  saveDraft();
}

function recordOrder() {
  state.order = {};
  sections().forEach((section, index) => {
    state.order[index] = [...section.children]
      .map((el) => el.dataset.leId)
      .filter(Boolean);
  });
  saveDraft();
}

function positionOverlay() {
  if (!selected || !selected.isConnected) {
    overlay.hidden = true;
    return;
  }
  const rect = selected.getBoundingClientRect();
  overlay.hidden = false;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  const cfg = state.blocks[idOf(selected)] || {};
  overlay.querySelector('.le-label').textContent = `${selected.dataset.blockName} · ${Math.round(rect.width)} × ${Math.round(rect.height)}${cfg.w ? ` (${cfg.w}%)` : ''}`;
  const cols = sectionOf(selected).dataset.layout?.match(/^columns-(\d)$/)?.[1] || '1';
  toolbar.querySelectorAll('[data-cols]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cols === cols)));
  const align = cfg.align || 'center';
  toolbar.querySelectorAll('[data-align]').forEach((b) => {
    b.setAttribute('aria-pressed', String(align === b.dataset.align));
  });
}

function select(block) {
  selected = block;
  positionOverlay();
}

function startResize(event, dir) {
  event.preventDefault();
  event.stopPropagation();
  const block = selected;
  const wrapper = wrapperOf(block);
  const style = getComputedStyle(wrapper);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const available = wrapper.clientWidth - padding;
  const start = block.getBoundingClientRect();
  const { clientX: x0, clientY: y0 } = event;
  const align = (state.blocks[idOf(block)] || {}).align || 'center';
  const factor = align === 'center' ? 2 : 1;
  document.body.classList.add('le-active-drag');

  const move = (e) => {
    const changes = {};
    if (dir.includes('e') || dir.includes('w')) {
      const sign = dir.includes('e') ? 1 : -1;
      const width = start.width + sign * (e.clientX - x0) * factor;
      changes.w = Math.min(100, Math.max(MIN_WIDTH, Math.round((width / available) * 100)));
    }
    if (dir.includes('s')) {
      changes.h = Math.max(MIN_HEIGHT, Math.round(start.height + (e.clientY - y0)));
    }
    setBlock(block, changes);
    positionOverlay();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.classList.remove('le-active-drag');
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function startMove(event) {
  event.preventDefault();
  event.stopPropagation();
  const dragged = wrapperOf(selected);
  dragging = true;
  document.body.classList.add('le-active-drag');
  dragged.classList.add('le-moving');

  const move = (e) => {
    overlay.style.pointerEvents = 'none';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = '';
    const target = under?.closest('main > .section > div');
    if (target && target !== dragged) {
      const rect = target.getBoundingClientRect();
      const grid = getComputedStyle(target.parentElement).display === 'grid'
        && getComputedStyle(target.parentElement).gridTemplateColumns.split(' ').length > 1;
      const before = grid
        ? e.clientX < rect.left + rect.width / 2
        : e.clientY < rect.top + rect.height / 2;
      target.parentElement.insertBefore(dragged, before ? target : target.nextSibling);
    }
    positionOverlay();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.classList.remove('le-active-drag');
    dragged.classList.remove('le-moving');
    dragging = false;
    recordOrder();
    positionOverlay();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function downloadOverrides() {
  const all = { ...fileOverrides, ...read(localStorage, DRAFT_KEY) };
  const blob = new Blob([`${JSON.stringify(all, null, 2)}\n`], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'layout-overrides.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function resetPage() {
  // eslint-disable-next-line no-alert
  if (!window.confirm('Reset every layout change on this page?')) return;
  const draft = read(localStorage, DRAFT_KEY);
  draft[pagePath()] = emptyState();
  write(localStorage, DRAFT_KEY, draft);
  window.location.reload();
}

const button = (label, attrs, onClick) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  Object.entries(attrs || {}).forEach(([k, v]) => b.setAttribute(k, v));
  b.addEventListener('click', onClick);
  return b;
};

function buildUI() {
  overlay = document.createElement('div');
  overlay.className = 'le-overlay';
  overlay.hidden = true;
  const label = document.createElement('span');
  label.className = 'le-label';
  overlay.append(label);

  const grip = button('⠿ Move', { class: 'le-grip', title: 'Drag to move this block' }, () => {});
  grip.addEventListener('pointerdown', startMove);
  overlay.append(grip);

  ['e', 's', 'w', 'se', 'sw'].forEach((dir) => {
    const handle = document.createElement('i');
    handle.className = `le-handle le-${dir}`;
    handle.addEventListener('pointerdown', (e) => startResize(e, dir));
    overlay.append(handle);
  });

  toolbar = document.createElement('div');
  toolbar.className = 'le-toolbar';
  [['Left', 'left'], ['Center', 'center'], ['Right', 'right']].forEach(([text, value]) => {
    toolbar.append(button(text, { 'data-align': value, title: `Align ${text.toLowerCase()}` }, () => {
      setBlock(selected, { align: value === 'center' ? '' : value });
      positionOverlay();
    }));
  });
  [1, 2, 3, 4].forEach((n) => {
    toolbar.append(button(`${n} col`, { 'data-cols': n, title: `${n} column(s) in this section` }, () => {
      const section = sectionOf(selected);
      const index = sections().indexOf(section);
      state.sections[index] = { cols: n };
      applySection(section, n);
      saveDraft();
      positionOverlay();
    }));
  });
  toolbar.append(button('Reset block', { title: 'Remove size and alignment changes' }, () => {
    delete state.blocks[idOf(selected)];
    applyBlock(selected, {});
    saveDraft();
    positionOverlay();
  }));
  overlay.append(toolbar);

  bar = document.createElement('div');
  bar.className = 'le-bar';
  const title = document.createElement('strong');
  title.textContent = 'Layout editor';
  const hint = document.createElement('span');
  hint.textContent = 'Click a block, drag its edges to resize';
  bar.append(
    title,
    hint,
    button('Download layout-overrides.json', { title: 'Commit this file to publish the layout' }, downloadOverrides),
    button('Reset page', {}, resetPage),
    button('Exit', {}, () => {
      write(sessionStorage, FLAG_KEY, false);
      window.location.reload();
    }),
  );

  document.body.append(overlay, bar);

  document.addEventListener('click', (e) => {
    if (dragging || e.target.closest('.le-overlay, .le-bar')) return;
    const block = e.target.closest('main .block');
    if (block) {
      e.preventDefault();
      select(topBlocks().find((b) => b === block || b.contains(block)));
    } else {
      select(null);
    }
  }, true);
  window.addEventListener('resize', positionOverlay);
  new ResizeObserver(positionOverlay).observe(main);
}

function editorRequested() {
  const param = new URLSearchParams(window.location.search).get('layout-edit');
  if (param === 'on') write(sessionStorage, FLAG_KEY, true);
  if (param === 'off') write(sessionStorage, FLAG_KEY, false);
  return read(sessionStorage, FLAG_KEY) === true || param === 'on';
}

/**
 * Applies saved layout changes and, when requested, starts the editor.
 * @param {Element} mainEl the main element
 */
export default async function initLayoutEditor(mainEl) {
  main = mainEl;
  try {
    const resp = await fetch(`${window.hlx.codeBasePath}/layout-overrides.json`);
    if (resp.ok) fileOverrides = await resp.json();
  } catch (e) {
    // no published overrides
  }
  const draft = read(localStorage, DRAFT_KEY);
  const editing = editorRequested();
  // visitors only get the published file, the draft is for people editing
  state = (editing && draft[pagePath()]) || fileOverrides[pagePath()] || emptyState();
  state = { ...emptyState(), ...state };

  tagElements();
  applyState();

  if (editing && window.matchMedia('(width >= 900px)').matches) {
    await loadCSS(`${window.hlx.codeBasePath}/styles/layout-editor.css`);
    buildUI();
  }
}
