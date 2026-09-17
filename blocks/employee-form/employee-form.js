const API_URL = 'https://jsonplaceholder.typicode.com/posts';

function renderResult(block, data) {
  const existingResult = block.querySelector('.employee-form-result');
  if (existingResult) existingResult.remove();

  const result = document.createElement('div');
  result.className = 'employee-form-result';
  result.innerHTML = `
    <h3>Employee Submitted</h3>
    <p><strong>ID:</strong> ${data.id}</p>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
  `;
  block.append(result);
}

async function submitEmployee(block, form, submitBtn, originalLabel) {
  const statusEl = block.querySelector('.employee-form-status');
  const nameInput = form.querySelector('#employee-name');
  const emailInput = form.querySelector('#employee-email');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  // basic validation before hitting the API
  if (!name || !email) {
    statusEl.textContent = 'Please fill in both Name and Email.';
    statusEl.classList.add('employee-form-error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';
  statusEl.textContent = '';
  statusEl.classList.remove('employee-form-error');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    // jsonplaceholder echoes back { name, email, id }
    renderResult(block, data);
    statusEl.textContent = 'Employee submitted successfully.';
    form.reset();
  } catch (err) {
    statusEl.textContent = 'Submission failed. Please try again.';
    statusEl.classList.add('employee-form-error');
    // eslint-disable-next-line no-console
    console.error('[employee-form] submit failed:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

export default function decorate(block) {
  if (block.dataset.efDecorated === 'true') return;
  block.dataset.efDecorated = 'true';

  const rows = [...block.children];
  const buttonLabel = rows[0]?.textContent?.trim() || 'Submit';

  block.textContent = '';
  block.classList.add('employee-form');

  const form = document.createElement('form');
  form.className = 'employee-form-fields';
  form.innerHTML = `
    <label for="employee-name">Name</label>
    <input type="text" id="employee-name" name="name" required />

    <label for="employee-email">Email</label>
    <input type="email" id="employee-email" name="email" required />
  `;

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button'; // deliberately not "submit" — no native form submission/page reload
  submitBtn.className = 'employee-form-btn';
  submitBtn.textContent = buttonLabel;

  const statusEl = document.createElement('p');
  statusEl.className = 'employee-form-status';

  form.append(submitBtn);
  block.append(form, statusEl);

  submitBtn.addEventListener('click', () => submitEmployee(block, form, submitBtn, buttonLabel));
}
