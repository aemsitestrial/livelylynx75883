const GRAPHQL_ENDPOINT = 'https://kscommerce.krisshop.com/graphql';

async function getGraphQLSchema() {
  const query = `
    {
      __schema {
        queryType {
          fields {
            name
          }
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  return response.json();
}

export default async function decorate(block) {
  block.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'airline-container';

  const title = document.createElement('h2');
  title.textContent = 'Airline';

  const loading = document.createElement('p');
  loading.textContent = 'Loading airline data...';

  container.append(title, loading);
  block.appendChild(container);

  try {
    const result = await getGraphQLSchema();

    loading.remove();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    // GraphQL requires the __schema field.
    // eslint-disable-next-line no-underscore-dangle
    const { __schema: schemaData } = result.data;
    const { queryType } = schemaData;
    const { fields = [] } = queryType;

    const airlineFields = fields.filter((field) => field.name.toLowerCase().includes('airline'));

    if (airlineFields.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No airline query was found in the GraphQL schema.';
      container.appendChild(message);
      return;
    }

    airlineFields.forEach((field) => {
      const item = document.createElement('div');
      item.className = 'airline-item';

      const name = document.createElement('h3');
      name.textContent = field.name;

      item.appendChild(name);
      container.appendChild(item);
    });
  } catch (error) {
    const message = document.createElement('p');
    message.textContent = 'Unable to load airline data.';
    loading.replaceWith(message);
    throw error;
  }
}
