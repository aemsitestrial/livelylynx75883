import fetchProducts, { PAGE_SIZE } from './product-catalog-api.js';

const SORT_OPTIONS = [
  { key: 'popularity', label: 'POPULARITY', field: 'ks_popularity: DESC' },
  { key: 'newest', label: 'NEWEST', field: 'created_at: DESC' },
  { key: 'price-asc', label: 'PRICE ▲', field: 'price: ASC' },
];

let currentSortKey = 'popularity';
let selectedBrandIds = new Set();
let selectedPriceRange = null;
let currentPage = 1;
let brandOptions = [];
let totalCount = 0;

// const SCENE7_BASE = 'https://s7ap1.scene7.com/is/image/krisshop';

function buildImageUrl(item) {
  // detail_image_url1 has the real product image — image.url is often just a placeholder
  if (item.detail_image_url1) {
    return item.detail_image_url1;
  }

  const img = item.image;
  if (Array.isArray(img) && img.length > 0 && img[0]?.url) {
    return img[0].url;
  }
  if (img?.url) {
    return img.url;
  }

  return '';
}

function mapProduct(item) {
  const brandInfo = item.custom_attributes?.product_brand;
  return {
    id: item.id,
    name: item.name,
    brand: brandInfo?.option_label || '',
    price: item.price_range?.minimum_price?.final_price?.value ?? 0,
    currency: item.price_range?.minimum_price?.final_price?.currency ?? '',
    miles: item.custom_attributes?.miles_point ?? 0,
    image: buildImageUrl(item),
  };
}

function renderCards(grid, items) {
  grid.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'product-catalog-card';
    card.innerHTML = `
      <div class="product-catalog-image">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="product-catalog-info">
        <p class="product-catalog-brand">${item.brand.toUpperCase()}</p>
        <p class="product-catalog-name">${item.name}</p>
        <p class="product-catalog-price">${item.currency} ${item.price.toFixed(2)}</p>
        <p class="product-catalog-miles">or ${item.miles} miles</p>
      </div>
    `;
    grid.append(card);
  });
}

// MOVED UP — now defined before renderBrandFilters uses it
async function loadAndRender(block) {
  const grid = block.querySelector('.product-catalog-grid');
  const countEl = block.querySelector('.product-catalog-count');
  const clearBtn = block.querySelector('.product-catalog-clear');

  grid.innerHTML = '<p class="product-catalog-loading">Loading products…</p>';

  const sortConfig = SORT_OPTIONS.find((s) => s.key === currentSortKey);

  try {
    const data = await fetchProducts({
      brandIds: [...selectedBrandIds],
      priceRange: selectedPriceRange,
      sortField: sortConfig.field,
      currentPage,
    });

    if (brandOptions.length === 0) {
      const brandAgg = data.aggregations.find((a) => a.attribute_code === 'product_brand');
      brandOptions = brandAgg ? brandAgg.options : [];
      // eslint-disable-next-line no-use-before-define
      renderBrandFilters(block.querySelector('.product-catalog-brand-group'), block);
    }

    totalCount = data.total_count;
    const items = data.items.map(mapProduct);
    renderCards(grid, items);
    countEl.textContent = `${totalCount} products found`;
    clearBtn.hidden = selectedBrandIds.size === 0 && !selectedPriceRange;
    // eslint-disable-next-line no-use-before-define
    renderPagination(block);
  } catch (err) {
    grid.innerHTML = '<p class="product-catalog-error">Unable to load products right now.</p>';
    // eslint-disable-next-line no-console
    console.error('[product-catalog] fetch failed:', err);
  }
}

function renderBrandFilters(container, block) {
  container.innerHTML = '<h3>BRANDS</h3>';
  brandOptions.forEach((opt) => {
    const label = document.createElement('label');
    label.className = 'product-catalog-checkbox';
    label.innerHTML = `<input type="checkbox" value="${opt.value}" /> ${opt.label} (${opt.count})`;
    label.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) selectedBrandIds.add(opt.value);
      else selectedBrandIds.delete(opt.value);
      currentPage = 1;
      loadAndRender(block);
    });
    container.append(label);
  });
}

function renderPagination(block) {
  let paginationEl = block.querySelector('.product-catalog-pagination');
  if (!paginationEl) {
    paginationEl = document.createElement('div');
    paginationEl.className = 'product-catalog-pagination';
    block.querySelector('.product-catalog-main').append(paginationEl);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  paginationEl.innerHTML = '';

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'product-catalog-page-btn';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    currentPage -= 1;
    loadAndRender(block);
  });

  const pageLabel = document.createElement('span');
  pageLabel.className = 'product-catalog-page-label';
  pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'product-catalog-page-btn';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    currentPage += 1;
    loadAndRender(block);
  });

  paginationEl.append(prevBtn, pageLabel, nextBtn);
}

function buildSortBar(block) {
  const sortBar = document.createElement('div');
  sortBar.className = 'product-catalog-sortbar';

  const label = document.createElement('span');
  label.className = 'product-catalog-sortlabel';
  label.textContent = 'SORT BY:';
  sortBar.append(label);

  SORT_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'product-catalog-sortbtn';
    btn.textContent = opt.label;
    btn.dataset.sort = opt.key;
    if (opt.key === currentSortKey) btn.classList.add('active');

    btn.addEventListener('click', () => {
      currentSortKey = opt.key;
      currentPage = 1;
      sortBar.querySelectorAll('.product-catalog-sortbtn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadAndRender(block);
    });

    sortBar.append(btn);
  });

  const countEl = document.createElement('span');
  countEl.className = 'product-catalog-count';
  sortBar.append(countEl);

  return sortBar;
}

function buildPriceRangeFilter(block) {
  const priceGroup = document.createElement('div');
  priceGroup.className = 'product-catalog-filter-group';

  const ABSOLUTE_MIN = 0;
  const ABSOLUTE_MAX = 100;

  priceGroup.innerHTML = `
    <h3>PRICE RANGE</h3>
    <div class="price-range-inputs">
      <div class="price-range-box">
        <span>SGD</span>
        <input type="number" class="price-range-min-input" value="${ABSOLUTE_MIN}" min="${ABSOLUTE_MIN}" max="${ABSOLUTE_MAX}" />
      </div>
      <span class="price-range-dash">-</span>
      <div class="price-range-box">
        <span>SGD</span>
        <input type="number" class="price-range-max-input" value="${ABSOLUTE_MAX}" min="${ABSOLUTE_MIN}" max="${ABSOLUTE_MAX}" />
      </div>
    </div>
    <div class="price-range-slider">
      <input type="range" class="price-range-slider-min" min="${ABSOLUTE_MIN}" max="${ABSOLUTE_MAX}" value="${ABSOLUTE_MIN}" />
      <input type="range" class="price-range-slider-max" min="${ABSOLUTE_MIN}" max="${ABSOLUTE_MAX}" value="${ABSOLUTE_MAX}" />
      <div class="price-range-track"></div>
    </div>
  `;

  const minInput = priceGroup.querySelector('.price-range-min-input');
  const maxInput = priceGroup.querySelector('.price-range-max-input');
  const minSlider = priceGroup.querySelector('.price-range-slider-min');
  const maxSlider = priceGroup.querySelector('.price-range-slider-max');
  const track = priceGroup.querySelector('.price-range-track');

  function updateTrack() {
    const min = Number(minSlider.value);
    const max = Number(maxSlider.value);
    const minPct = ((min - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100;
    const maxPct = ((max - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100;
    track.style.left = `${minPct}%`;
    track.style.right = `${100 - maxPct}%`;
  }

  function applyRange(min, max) {
    selectedPriceRange = { min, max };
    currentPage = 1;
    loadAndRender(block);
  }

  minSlider.addEventListener('input', () => {
    const min = Math.min(Number(minSlider.value), Number(maxSlider.value) - 1);
    minSlider.value = min;
    minInput.value = min;
    updateTrack();
  });
  minSlider.addEventListener('change', () => applyRange(Number(minSlider.value), Number(maxSlider.value)));

  maxSlider.addEventListener('input', () => {
    const max = Math.max(Number(maxSlider.value), Number(minSlider.value) + 1);
    maxSlider.value = max;
    maxInput.value = max;
    updateTrack();
  });
  maxSlider.addEventListener('change', () => applyRange(Number(minSlider.value), Number(maxSlider.value)));

  minInput.addEventListener('change', () => {
    let val = Number(minInput.value);
    val = Math.max(ABSOLUTE_MIN, Math.min(val, Number(maxSlider.value) - 1));
    minInput.value = val;
    minSlider.value = val;
    updateTrack();
    applyRange(val, Number(maxSlider.value));
  });

  maxInput.addEventListener('change', () => {
    let val = Number(maxInput.value);
    val = Math.min(ABSOLUTE_MAX, Math.max(val, Number(minSlider.value) + 1));
    maxInput.value = val;
    maxSlider.value = val;
    updateTrack();
    applyRange(Number(minSlider.value), val);
  });

  updateTrack();

  // Expose a reset function so buildSidebar's single Clear Filters button can use it
  priceGroup.resetPriceUI = () => {
    minSlider.value = ABSOLUTE_MIN;
    maxSlider.value = ABSOLUTE_MAX;
    minInput.value = ABSOLUTE_MIN;
    maxInput.value = ABSOLUTE_MAX;
    updateTrack();
  };

  return priceGroup;
}

function buildSidebar(block) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'product-catalog-sidebar';

  const brandGroup = document.createElement('div');
  brandGroup.className = 'product-catalog-filter-group product-catalog-brand-group';
  brandGroup.innerHTML = '<h3>BRANDS</h3><p class="product-catalog-loading-text">Loading…</p>';

  const priceGroup = buildPriceRangeFilter(block);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'product-catalog-clear';
  clearBtn.textContent = 'Clear Filters';
  clearBtn.hidden = true;

  clearBtn.addEventListener('click', () => {
    selectedBrandIds = new Set();
    selectedPriceRange = null;
    currentPage = 1;
    sidebar.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
    priceGroup.resetPriceUI();
    clearBtn.hidden = true;
    loadAndRender(block);
  });

  sidebar.append(brandGroup, priceGroup, clearBtn);
  return sidebar;
}

export default function decorate(block) {
  if (block.dataset.pcDecorated === 'true') return;
  block.dataset.pcDecorated = 'true';

  block.textContent = '';
  block.classList.add('product-catalog');

  const layout = document.createElement('div');
  layout.className = 'product-catalog-layout';

  const sidebar = buildSidebar(block);
  const main = document.createElement('div');
  main.className = 'product-catalog-main';

  const sortBar = buildSortBar(block);
  const grid = document.createElement('div');
  grid.className = 'product-catalog-grid';

  main.append(sortBar, grid);
  layout.append(sidebar, main);
  block.append(layout);

  loadAndRender(block);
}
