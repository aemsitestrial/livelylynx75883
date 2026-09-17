// Default endpoint used only when the author hasn't set a "Form Action URL".
// It's a public echo API for demos - swap it for a real endpoint (a Google
// Sheets web-app, Formspree, your own serverless function, etc.) via the
// "Form Action URL" field in the Universal Editor so submissions land
// somewhere you can actually retrieve them.
const DEFAULT_ACTION_URL = 'https://jsonplaceholder.typicode.com/posts';
const DEFAULT_SUCCESS_MESSAGE = 'Thanks! Your submission has been received.';

const TEXT_LIKE_TYPES = ['text', 'email', 'tel', 'number', 'date'];
const CHOICE_TYPES = ['select', 'radio'];

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

// A "boolean" model field is authored as plain text content ("true"/"false")
// once it lands in the document. Treat anything else as "false".
function isTrue(cell) {
  if (!cell) return false;
  return cell.textContent.trim().toLowerCase() === 'true';
}

// The "options" cell is dual-purpose (kept us within the 4-field cap the
// xwalk/max-cells lint rule enforces per model):
// - Dropdown / Radio: a comma-separated list of choices, e.g. "Tokyo, Osaka".
//   Prefix one choice with "*" to make it the default, e.g. "*Tokyo, Osaka".
// - Any other field type: the whole value is used as the default value.
function parseOptionsField(raw, type) {
  if (!raw) return { options: [], defaultValue: '' };

  if (!CHOICE_TYPES.includes(type)) {
    return { options: [], defaultValue: raw };
  }

  const options = [];
  let defaultValue = '';
  raw.split(',').forEach((entry) => {
    let opt = entry.trim();
    if (!opt) return;
    if (opt.startsWith('*')) {
      opt = opt.slice(1).trim();
      defaultValue = opt;
    }
    if (opt) options.push(opt);
  });

  return { options, defaultValue };
}

// Each "Form Field" item is authored as a child block/item, which lands in
// the DOM as one row per item; within that row each sub-field (label, type,
// options, required) is one cell, in the order defined in the model.
function readFieldConfig(row, index) {
  const [labelCell, typeCell, optionsCell, requiredCell] = [...row.children];

  const label = labelCell?.textContent.trim() || `Field ${index + 1}`;
  const name = slugify(label) || `field-${index + 1}`;
  const type = typeCell?.textContent.trim().toLowerCase() || 'text';
  const { options, defaultValue } = parseOptionsField(
    optionsCell?.textContent.trim() || '',
    type,
  );
  const required = isTrue(requiredCell);

  return {
    label, name, type, options, defaultValue, required,
  };
}

function buildFieldRow(config, fieldId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-builder-row';
  wrapper.dataset.fieldType = config.type;
  wrapper.dataset.fieldName = config.name;

  if (config.type === 'checkbox') {
    const label = document.createElement('label');
    label.className = 'form-builder-checkbox';
    label.setAttribute('for', fieldId);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = fieldId;
    input.name = config.name;
    input.required = config.required;
    input.checked = ['true', 'yes', 'checked'].includes(config.defaultValue.toLowerCase());

    label.append(input, document.createTextNode(` ${config.label}${config.required ? ' *' : ''}`));
    wrapper.append(label);
    return wrapper;
  }

  const label = document.createElement('label');
  label.setAttribute('for', fieldId);
  label.textContent = config.label + (config.required ? ' *' : '');
  wrapper.append(label);

  if (config.type === 'textarea') {
    const textarea = document.createElement('textarea');
    textarea.id = fieldId;
    textarea.name = config.name;
    textarea.rows = 4;
    textarea.required = config.required;
    if (config.defaultValue) textarea.value = config.defaultValue;
    wrapper.append(textarea);
    return wrapper;
  }

  if (config.type === 'select') {
    const select = document.createElement('select');
    select.id = fieldId;
    select.name = config.name;
    select.required = config.required;
    select.innerHTML = config.options
      .map((opt) => `<option value="${opt}">${opt}</option>`)
      .join('');
    if (config.defaultValue && config.options.includes(config.defaultValue)) {
      select.value = config.defaultValue;
    }
    wrapper.append(select);
    return wrapper;
  }

  if (config.type === 'radio') {
    const group = document.createElement('div');
    group.className = 'form-builder-radio-group';
    config.options.forEach((opt, i) => {
      const optionLabel = document.createElement('label');
      optionLabel.className = 'form-builder-radio';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = config.name;
      input.value = opt;
      input.required = config.required;
      input.id = `${fieldId}-${i}`;
      if (config.defaultValue ? opt === config.defaultValue : i === 0) input.checked = true;
      optionLabel.append(input, document.createTextNode(` ${opt}`));
      group.append(optionLabel);
    });
    wrapper.append(group);
    return wrapper;
  }

  // text, email, tel, number, date - or anything unrecognised falls back to text
  const input = document.createElement('input');
  input.type = TEXT_LIKE_TYPES.includes(config.type) ? config.type : 'text';
  input.id = fieldId;
  input.name = config.name;
  input.required = config.required;
  if (config.defaultValue) input.value = config.defaultValue;
  wrapper.append(input);
  return wrapper;
}

function buildForm(fieldConfigs) {
  const form = document.createElement('form');
  form.className = 'form-builder-fields';
  form.noValidate = true;

  fieldConfigs.forEach((config, index) => {
    const fieldId = `fb-${config.name}-${index}`;
    form.append(buildFieldRow(config, fieldId));
  });

  return form;
}

function validate(form, fieldConfigs, statusEl) {
  const errors = [];

  fieldConfigs.forEach((config) => {
    if (!config.required) return;

    if (config.type === 'radio') {
      const checked = form.querySelector(`input[name="${config.name}"]:checked`);
      if (!checked) errors.push(`"${config.label}" is required.`);
      return;
    }

    if (config.type === 'checkbox') {
      const input = form.querySelector(`input[name="${config.name}"]`);
      if (input && !input.checked) errors.push(`"${config.label}" is required.`);
      return;
    }

    const field = form.querySelector(`[name="${config.name}"]`);
    if (field && !field.value.trim()) errors.push(`"${config.label}" is required.`);
  });

  const emailField = fieldConfigs.find((config) => config.type === 'email');
  if (emailField) {
    const input = form.querySelector(`[name="${emailField.name}"]`);
    const value = input?.value.trim();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push('Please enter a valid email address.');
    }
  }

  if (errors.length) {
    const [firstError] = errors;
    statusEl.textContent = firstError;
    statusEl.classList.add('form-builder-error');
    return false;
  }

  statusEl.textContent = '';
  statusEl.classList.remove('form-builder-error');
  return true;
}

function collectData(form, fieldConfigs) {
  const data = {};
  fieldConfigs.forEach((config) => {
    if (config.type === 'checkbox') {
      data[config.name] = form.querySelector(`input[name="${config.name}"]`)?.checked || false;
    } else if (config.type === 'radio') {
      data[config.name] = form.querySelector(`input[name="${config.name}"]:checked`)?.value || '';
    } else {
      data[config.name] = form.querySelector(`[name="${config.name}"]`)?.value || '';
    }
  });
  data.submittedAt = new Date().toISOString();
  return data;
}

async function submitForm(block, form, fieldConfigs, submitBtn, {
  actionUrl, buttonLabel, successMessage,
}) {
  const statusEl = block.querySelector('.form-builder-status');
  if (!validate(form, fieldConfigs, statusEl)) return;

  const data = collectData(form, fieldConfigs);

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
    statusEl.classList.remove('form-builder-error');
    form.reset();
  } catch (err) {
    statusEl.textContent = 'Something went wrong submitting the form. Please try again.';
    statusEl.classList.add('form-builder-error');
    // eslint-disable-next-line no-console
    console.error('[form-builder] submit failed:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = buttonLabel;
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  const [
    titleRow, descriptionRow, buttonLabelRow, actionUrlRow, ...fieldRows
  ] = rows;

  const title = titleRow?.textContent.trim() || '';
  const description = descriptionRow?.innerHTML.trim();
  const buttonLabel = buttonLabelRow?.textContent.trim() || 'Submit';
  const actionUrl = actionUrlRow?.textContent.trim() || DEFAULT_ACTION_URL;
  const successMessage = DEFAULT_SUCCESS_MESSAGE;

  // Rows with no content (e.g. an author who hasn't added any "Form Field"
  // items yet) are skipped rather than rendered as an empty field.
  const fieldConfigs = fieldRows
    .filter((row) => row.textContent.trim())
    .map((row, index) => readFieldConfig(row, index));

  block.textContent = '';
  block.classList.add('form-builder');

  if (title) {
    const heading = document.createElement('h2');
    heading.className = 'form-builder-title';
    heading.textContent = title;
    block.append(heading);
  }

  if (description) {
    const descWrapper = document.createElement('div');
    descWrapper.className = 'form-builder-description';
    descWrapper.innerHTML = description;
    block.append(descWrapper);
  }

  if (!fieldConfigs.length) {
    const empty = document.createElement('p');
    empty.className = 'form-builder-empty';
    empty.textContent = 'No form fields have been configured yet. Add "Form Field" items in the editor to build this form.';
    block.append(empty);
    return;
  }

  const form = buildForm(fieldConfigs);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button'; // deliberately not "submit" - avoids a native page reload
  submitBtn.className = 'form-builder-btn';
  submitBtn.textContent = buttonLabel;
  form.append(submitBtn);

  const statusEl = document.createElement('p');
  statusEl.className = 'form-builder-status';
  statusEl.setAttribute('role', 'status');

  block.append(form, statusEl);

  submitBtn.addEventListener('click', () => submitForm(block, form, fieldConfigs, submitBtn, {
    actionUrl, buttonLabel, successMessage,
  }));
}
