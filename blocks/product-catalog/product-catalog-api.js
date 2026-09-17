import config from '../../scripts/config.js';

const {
  graphqlEndpoint: GRAPHQL_ENDPOINT,
  targetSegment: TARGET_SEGMENT,
  pageSize: PAGE_SIZE,
} = config;

function buildQuery({
  brandIds, priceRange, sortField, currentPage,
}) {
  const brandFilter = brandIds && brandIds.length
    ? `product_brand: { in: [${brandIds.map((id) => `"${id}"`).join(', ')}] }`
    : '';

  const priceFilter = priceRange
    ? `price: { from: "${priceRange.min}" to: "${priceRange.max}" }`
    : '';

  const filterBlock = `filter: {
    ${brandFilter}
    ${priceFilter}
    targetsegment: { eq: "${TARGET_SEGMENT}" }
  }`;

  const sortBlock = `sort: { ${sortField} }`;

  return `{
    products(
      ${filterBlock}
      ${sortBlock}
      pageSize: ${PAGE_SIZE}
      currentPage: ${currentPage}
    ) {
      total_count
      page_info { page_size current_page }
      aggregations {
        attribute_code
        count
        label
        options { label value count }
      }
      items {
        custom_attributes {
          miles_point
          product_brand { option_id option_label }
        }
        detail_image_url1
        id
        image { url label }
        name
        title
        sku
        url_key
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
          }
        }
      }
    }
  }`;
}

async function fetchProducts({
  brandIds = [], priceRange = null, sortField = 'ks_popularity: DESC', currentPage = 1,
} = {}) {
  const query = buildQuery({
    brandIds, priceRange, sortField, currentPage,
  });
  const url = `${GRAPHQL_ENDPOINT}?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`GraphQL error: ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }

  return json.data.products;
}

export default fetchProducts;
export { PAGE_SIZE };
