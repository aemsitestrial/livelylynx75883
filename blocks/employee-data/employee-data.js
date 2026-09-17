const API_URL = 'https://jsonplaceholder.typicode.com/users';

function renderTable(block, employees) {
  const table = document.createElement('table');
  table.className = 'employee-data-grid';

  const thead = document.createElement('thead');

  thead.innerHTML = `
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Company</th>
    </tr>
    `;

  const tbody = document.createElement('tbody');

  employees.forEach((emp) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${emp.id}</td>
      <td>${emp.name}</td>
      <td>${emp.email}</td>
      <td>${emp.company?.name ?? '-'}</td>
    `;
    tbody.append(tr);
  });

  table.append(thead, tbody);

  const existingTable = block.querySelector('.employee-data-grid');
  if (existingTable) existingTable.remove();
  block.append(table);
}

async function fetchEmployees(block, button, originalLabel) {
  const statusEl = block.querySelector('.employee-data-status');

  button.disabled = true;
  button.textContent = 'Loading…';
  statusEl.textContent = '';
  statusEl.classList.remove('employee-data-error');

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    renderTable(block, data);
    statusEl.textContent = `Loaded ${data.length} employees.`;
  } catch (err) {
    statusEl.textContent = 'Failed to load employee data. Please try again.';
    statusEl.classList.add('employee-data-error');
    // eslint-disable-next-line no-console
    console.error('[employee-data] fetch failed:', err);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  const buttonLabel = rows[0]?.textContent?.trim() || 'Load Employee';

  block.textContent = '';
  block.classList.add('employee-data');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'employee-data-btn';
  button.textContent = buttonLabel;

  const statusEl = document.createElement('p');
  statusEl.className = 'employee-data-status';

  block.append(button, statusEl);

  button.addEventListener('click', () => fetchEmployees(block, button, buttonLabel));
}
