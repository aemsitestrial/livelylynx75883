const GRAPHQL_ENDPOINT = 'https://countries.trevorblades.com/';

async function getCountries() {
  const query = `
    {
      countries {
        code
        name
        capital
        currency
        emoji
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

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.countries;
}

export default async function decorate(block) {
  block.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'airline-container';

  const title = document.createElement('h2');
  title.textContent = 'Airline';

  const loading = document.createElement('p');
  loading.textContent = 'Loading data...';

  container.append(title, loading);
  block.appendChild(container);

  try {
    const countries = await getCountries();

    loading.remove();

    const grid = document.createElement('div');
    grid.className = 'airline-grid';

    countries.slice(0, 12).forEach((country) => {
      const card = document.createElement('div');
      card.className = 'airline-card';

      const emoji = document.createElement('div');
      emoji.className = 'airline-emoji';
      emoji.textContent = country.emoji;

      const name = document.createElement('h3');
      name.textContent = country.name;

      const code = document.createElement('p');
      code.textContent = `Code: ${country.code}`;

      const capital = document.createElement('p');
      capital.textContent = `Capital: ${country.capital || 'N/A'}`;

      const currency = document.createElement('p');
      currency.textContent = `Currency: ${country.currency || 'N/A'}`;

      card.append(emoji, name, code, capital, currency);
      grid.appendChild(card);
    });

    container.appendChild(grid);
  } catch (error) {
    const message = document.createElement('p');
    message.textContent = 'Unable to load data.';
    loading.replaceWith(message);
  }
}
