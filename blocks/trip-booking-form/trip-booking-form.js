// Default endpoint used only when the author hasn't set a "Form Action URL".
// It's a public echo API for demos - swap it for a real endpoint (a Google
// Sheets web-app, Formspree, your own serverless function, etc.) via the
// "Form Action URL" field in the Universal Editor so submissions land
// somewhere you can actually retrieve them.
const DEFAULT_ACTION_URL = 'https://jsonplaceholder.typicode.com/posts';

const DESTINATIONS = ['Tokyo', 'Osaka', 'Kyoto', 'Sapporo', 'Fukuoka', 'Okinawa'];
const TRAVEL_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First'];

function buildForm() {
  const form = document.createElement('form');
  form.className = 'trip-booking-form-fields';
  form.noValidate = true;

  form.innerHTML = `
    <div class="trip-booking-form-row">
      <label for="tbf-name">Full name</label>
      <input type="text" id="tbf-name" name="name" autocomplete="name" required />
    </div>

    <div class="trip-booking-form-row">
      <label for="tbf-email">Email</label>
      <input type="email" id="tbf-email" name="email" autocomplete="email" required />
    </div>

    <div class="trip-booking-form-row">
      <label for="tbf-phone">Phone (optional)</label>
      <input type="tel" id="tbf-phone" name="phone" autocomplete="tel" />
    </div>

    <div class="trip-booking-form-row">
      <label for="tbf-destination">Destination in Japan</label>
      <select id="tbf-destination" name="destination" required>
        ${DESTINATIONS.map((city) => `<option value="${city}">${city}</option>`).join('')}
      </select>
    </div>

    <fieldset class="trip-booking-form-row trip-booking-form-trip-type">
      <legend>Trip type</legend>
      <label class="trip-booking-form-radio">
        <input type="radio" name="tripType" value="round-trip" checked /> Round-trip
      </label>
      <label class="trip-booking-form-radio">
        <input type="radio" name="tripType" value="one-way" /> One-way
      </label>
    </fieldset>

    <div class="trip-booking-form-row trip-booking-form-two-col">
      <div>
        <label for="tbf-departure">Departure date</label>
        <input type="date" id="tbf-departure" name="departureDate" required />
      </div>
      <div>
        <label for="tbf-return">Return date</label>
        <input type="date" id="tbf-return" name="returnDate" />
      </div>
    </div>

    <div class="trip-booking-form-row trip-booking-form-two-col">
      <div>
        <label for="tbf-travelers">Number of travelers</label>
        <input type="number" id="tbf-travelers" name="travelers" min="1" max="20" value="1" required />
      </div>
      <div>
        <label for="tbf-class">Class</label>
        <select id="tbf-class" name="travelClass">
          ${TRAVEL_CLASSES.map((c) => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="trip-booking-form-row">
      <label for="tbf-requests">Special requests (optional)</label>
      <textarea id="tbf-requests" name="specialRequests" rows="3"></textarea>
    </div>
  `;

  return form;
}

function toggleReturnDate(form) {
  const oneWay = form.querySelector('input[name="tripType"][value="one-way"]');
  const returnInput = form.querySelector('#tbf-return');
  const sync = () => {
    const isOneWay = oneWay.checked;
    returnInput.disabled = isOneWay;
    returnInput.required = !isOneWay;
    if (isOneWay) returnInput.value = '';
  };
  form.querySelectorAll('input[name="tripType"]').forEach((radio) => {
    radio.addEventListener('change', sync);
  });
  sync();
}

function validate(form, statusEl) {
  const errors = [];
  const required = form.querySelectorAll('[required]:not(:disabled)');
  required.forEach((field) => {
    if (!field.value.trim()) errors.push(`"${field.previousElementSibling?.textContent || field.name}" is required.`);
  });

  const departure = form.querySelector('#tbf-departure').value;
  const returnDate = form.querySelector('#tbf-return');
  if (!returnDate.disabled && returnDate.value && departure && returnDate.value < departure) {
    errors.push('Return date must be on or after the departure date.');
  }

  const email = form.querySelector('#tbf-email').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  if (errors.length) {
    const [firstError] = errors;
    statusEl.textContent = firstError;
    statusEl.classList.add('trip-booking-form-error');
    return false;
  }

  statusEl.textContent = '';
  statusEl.classList.remove('trip-booking-form-error');
  return true;
}

function collectData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.submittedAt = new Date().toISOString();
  return data;
}

async function submitForm(block, form, submitBtn, {
  actionUrl, buttonLabel, successMessage,
}) {
  const statusEl = block.querySelector('.trip-booking-form-status');
  if (!validate(form, statusEl)) return;

  const data = collectData(form);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    const response = await fetch(actionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Submission failed: ${response.status}`);

    statusEl.textContent = successMessage;
    statusEl.classList.remove('trip-booking-form-error');
    form.reset();
    toggleReturnDate(form);
  } catch (err) {
    statusEl.textContent = 'Something went wrong submitting the form. Please try again.';
    statusEl.classList.add('trip-booking-form-error');
    // eslint-disable-next-line no-console
    console.error('[trip-booking-form] submit failed:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = buttonLabel;
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  const [
    titleRow,
    descriptionRow,
    buttonLabelRow,
    actionUrlRow,
  ] = rows;

  const title = titleRow?.textContent.trim() || 'Book Your Trip to Japan';
  const description = descriptionRow?.innerHTML.trim();
  const buttonLabel = buttonLabelRow?.textContent.trim() || 'Book Now';
  const actionUrl = actionUrlRow?.textContent.trim() || DEFAULT_ACTION_URL;
  const successMessage = 'Thanks! Your trip request has been received.';

  block.textContent = '';
  block.classList.add('trip-booking-form');

  const heading = document.createElement('h2');
  heading.className = 'trip-booking-form-title';
  heading.textContent = title;
  block.append(heading);

  if (description) {
    const descWrapper = document.createElement('div');
    descWrapper.className = 'trip-booking-form-description';
    descWrapper.innerHTML = description;
    block.append(descWrapper);
  }

  const form = buildForm();
  toggleReturnDate(form);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button'; // deliberately not "submit" - avoids a native page reload
  submitBtn.className = 'trip-booking-form-btn';
  submitBtn.textContent = buttonLabel;
  form.append(submitBtn);

  const statusEl = document.createElement('p');
  statusEl.className = 'trip-booking-form-status';
  statusEl.setAttribute('role', 'status');

  block.append(form, statusEl);

  submitBtn.addEventListener('click', () => submitForm(block, form, submitBtn, {
    actionUrl, buttonLabel, successMessage,
  }));
}
