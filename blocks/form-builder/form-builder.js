import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * Form Builder
 * ------------
 * Container block. Authoring layout (see _form-builder.json):
 *
 *   rows 1-3  block properties, one single-cell row each:
 *             intro (rich text) | submit button label | form action URL
 *   rows 4+   one row per child item. The FIRST cell of every item is its
 *             "type", which tells this script what the row is:
 *
 *     input types  -> form-input    type | label | details | flags
 *     choice types -> form-choice   type | label | options | flags
 *     checkbox/switch -> form-consent  type | label | details | flags
 *     file         -> form-file     type | label | details | flags
 *     section/heading/note/divider -> form-section  type | heading | body
 *     settings     -> form-settings type | success message | redirect | details
 *
 *   "flags" is the collapsed `classes_*` group: a comma separated list such as
 *   "required, half". "details" is a small `key: value` per line text area.
 */

const DEFAULT_SUCCESS = 'Thanks! Your submission has been received.';
const DEFAULT_ERROR = 'Something went wrong while sending the form. Please try again.';
const REQUEST_TIMEOUT_MS = 15000;

const INPUT_TYPES = [
  'text', 'email', 'tel', 'url', 'password', 'number', 'date', 'time',
  'datetime-local', 'month', 'color', 'range', 'hidden', 'textarea',
];
const CHOICE_TYPES = ['select', 'radio', 'checkbox-group'];
const CONSENT_TYPES = ['checkbox', 'switch'];
const LAYOUT_TYPES = ['section', 'heading', 'note', 'divider'];

const DETAIL_KEYS = [
  'name', 'placeholder', 'help', 'default', 'value', 'pattern', 'min', 'max', 'step',
  'minlength', 'maxlength', 'rows', 'autocomplete', 'error', 'accept', 'maxsize',
  'format', 'method', 'sending', 'reset',
];

let formCounter = 0;

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_+|_+$)/g, '');
}

/** Single-line text of a cell. */
function textOf(cell) {
  return cell ? cell.textContent.replace(/\s+/g, ' ').trim() : '';
}

/** Multi-line text of a cell (keeps <br> and paragraph breaks as new lines). */
function linesOf(cell) {
  if (!cell) return [];
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  clone.querySelectorAll('p, div, li').forEach((node) => node.append('\n'));
  return clone.textContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** URL-ish value: text fields holding a URL are turned into links by the pipeline. */
function urlOf(cell) {
  if (!cell) return '';
  const link = cell.querySelector('a');
  return (link?.getAttribute('href') || textOf(cell)).trim();
}

function flagsOf(cell) {
  return new Set(textOf(cell).toLowerCase().split(/[\s,]+/).filter(Boolean));
}

/**
 * Parses "key: value" lines. When `atOnly` is true only lines starting with "@"
 * are settings (used where the other lines are data, e.g. choice options).
 * Everything that is not a setting is returned in `rest`.
 */
function parseDetails(lines, atOnly = false) {
  const settings = {};
  const rest = [];
  lines.forEach((line) => {
    const hasAt = line.startsWith('@');
    const match = (hasAt ? line.slice(1) : line).match(/^([a-zA-Z]+)\s*:\s*(.*)$/);
    const key = match ? match[1].toLowerCase() : '';
    if (match && DETAIL_KEYS.includes(key) && (hasAt || !atOnly)) {
      settings[key] = match[2].trim();
    } else {
      rest.push(line);
    }
  });
  return { settings, rest };
}

function parseOptions(lines) {
  return lines.map((line) => {
    let text = line;
    let selected = false;
    if (text.startsWith('*')) {
      selected = true;
      text = text.slice(1).trim();
    }
    const [value, ...labelParts] = text.split('|');
    const label = labelParts.length ? labelParts.join('|').trim() : value.trim();
    return { value: value.trim(), label, selected };
  }).filter((opt) => opt.label);
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    node.setAttribute(key, value === true ? '' : value);
  });
  return node;
}

function setIf(node, attr, value) {
  if (value !== undefined && value !== '') node.setAttribute(attr, value);
}

/** Moves the authored (rich text) content of a cell into `target`. */
function moveContent(cell, target) {
  if (!cell) return false;
  const paragraphs = [...cell.children];
  if (paragraphs.length === 1 && paragraphs[0].tagName === 'P' && target.tagName === 'SPAN') {
    target.append(...paragraphs[0].childNodes);
  } else {
    target.append(...cell.childNodes);
  }
  return target.textContent.trim() !== '' || target.children.length > 0;
}

/* ------------------------------------------------------------------ */
/* field construction                                                  */
/* ------------------------------------------------------------------ */

function layoutClasses(flags) {
  const classes = ['form-builder-field'];
  if (flags.has('half')) classes.push('is-half');
  if (flags.has('third')) classes.push('is-third');
  return classes.join(' ');
}

function addHelpAndError(wrapper, id, help) {
  if (help) {
    const helpEl = el('p', 'form-builder-help', { id: `${id}-help` });
    helpEl.textContent = help;
    wrapper.append(helpEl);
  }
  const errorEl = el('p', 'form-builder-error', { id: `${id}-error`, hidden: true });
  wrapper.append(errorEl);
  return errorEl;
}

function describedBy(controls, id, help) {
  const ids = [];
  if (help) ids.push(`${id}-help`);
  ids.push(`${id}-error`);
  controls.forEach((control) => control.setAttribute('aria-describedby', ids.join(' ')));
}

/** Browsers ignore (and log) an invalid pattern; skip it so one typo can't break a field. */
function isValidPattern(pattern) {
  try {
    // same flags the browser uses for the `pattern` attribute
    return Boolean(new RegExp(`^(?:${pattern})$`, 'v'));
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`[form-builder] ignoring invalid pattern "${pattern}"`);
    return false;
  }
}

function applyInputSettings(control, settings) {
  setIf(control, 'placeholder', settings.placeholder);
  if (settings.pattern && isValidPattern(settings.pattern)) control.setAttribute('pattern', settings.pattern);
  setIf(control, 'min', settings.min);
  setIf(control, 'max', settings.max);
  setIf(control, 'step', settings.step);
  setIf(control, 'minlength', settings.minlength);
  setIf(control, 'maxlength', settings.maxlength);
  setIf(control, 'autocomplete', settings.autocomplete);
}

function buildLabel(text, id, required) {
  const label = el('label', 'form-builder-label', { for: id });
  label.append(document.createTextNode(text));
  if (required) {
    const mark = el('span', 'form-builder-required', { 'aria-hidden': 'true' });
    mark.textContent = ' *';
    label.append(mark);
    const sr = el('span', 'form-builder-visually-hidden');
    sr.textContent = ' (required)';
    label.append(sr);
  }
  return label;
}

function buildInputField(ctx, {
  type, label, settings, flags,
}) {
  const name = ctx.uniqueName(settings.name || label);
  const id = ctx.nextId();
  const required = flags.has('required');

  if (type === 'hidden') {
    const wrapper = el('div', 'form-builder-field is-hidden-field');
    const input = el('input', '', { type: 'hidden', name });
    input.value = settings.default ?? settings.value ?? '';
    wrapper.append(input);
    return {
      wrapper,
      record: {
        name, type, label, controls: [input], required: false,
      },
    };
  }

  const wrapper = el('div', `${layoutClasses(flags)} is-${type}`);
  const labelEl = buildLabel(label, id, required);
  if (flags.has('hidelabel')) labelEl.classList.add('form-builder-visually-hidden');
  wrapper.append(labelEl);

  const control = type === 'textarea'
    ? el('textarea', 'form-builder-control', { id, name, rows: settings.rows || '4' })
    : el('input', 'form-builder-control', { id, name, type });
  control.required = required;
  control.readOnly = flags.has('readonly');
  applyInputSettings(control, settings);
  if (settings.default !== undefined) control.value = settings.default;

  if (type === 'range') {
    const row = el('div', 'form-builder-range');
    const output = el('output', 'form-builder-range-output', { for: id });
    const sync = () => { output.textContent = control.value; };
    control.addEventListener('input', sync);
    control.addEventListener('reset-output', sync);
    row.append(control, output);
    wrapper.append(row);
    sync();
  } else {
    wrapper.append(control);
  }

  const errorEl = addHelpAndError(wrapper, id, settings.help);
  describedBy([control], id, settings.help);
  return {
    wrapper,
    record: {
      name, type, label, controls: [control], required, errorEl, customError: settings.error,
    },
  };
}

function buildSelectField(ctx, {
  label, options, settings, flags,
}) {
  const name = ctx.uniqueName(settings.name || label);
  const id = ctx.nextId();
  const required = flags.has('required');
  const multiple = flags.has('multiple');

  const wrapper = el('div', `${layoutClasses(flags)} is-select`);
  wrapper.append(buildLabel(label, id, required));

  const select = el('select', 'form-builder-control', { id, name });
  select.required = required;
  select.multiple = multiple;

  const hasDefault = options.some((opt) => opt.selected);
  if (!multiple && (settings.placeholder || !hasDefault)) {
    const placeholder = el('option', '', { value: '' });
    placeholder.textContent = settings.placeholder || 'Select…';
    placeholder.selected = !hasDefault;
    select.append(placeholder);
  }
  options.forEach((opt) => {
    const option = el('option', '', { value: opt.value });
    option.textContent = opt.label;
    option.selected = opt.selected;
    select.append(option);
  });
  wrapper.append(select);

  const errorEl = addHelpAndError(wrapper, id, settings.help);
  describedBy([select], id, settings.help);
  return {
    wrapper,
    record: {
      name,
      type: 'select',
      label,
      controls: [select],
      required,
      errorEl,
      customError: settings.error,
    },
  };
}

function buildOptionGroup(ctx, {
  type, label, options, settings, flags,
}) {
  const name = ctx.uniqueName(settings.name || label);
  const id = ctx.nextId();
  const required = flags.has('required');
  const inputType = type === 'radio' ? 'radio' : 'checkbox';

  const wrapper = el('fieldset', `${layoutClasses(flags)} is-${type}`);
  const legend = el('legend', 'form-builder-label');
  legend.append(document.createTextNode(label));
  if (required) {
    const mark = el('span', 'form-builder-required', { 'aria-hidden': 'true' });
    mark.textContent = ' *';
    legend.append(mark);
    const sr = el('span', 'form-builder-visually-hidden');
    sr.textContent = ' (required)';
    legend.append(sr);
  }
  wrapper.append(legend);

  const list = el('div', `form-builder-options${flags.has('inline') ? ' is-inline' : ''}`);
  const controls = options.map((opt, index) => {
    const optionLabel = el('label', 'form-builder-choice');
    const input = el('input', '', {
      type: inputType, name, value: opt.value, id: `${id}-${index}`,
    });
    // native `required` on a radio group means "one must be chosen"; for a
    // checkbox group "at least one" is checked in validateRecord() instead
    input.required = required && inputType === 'radio';
    input.checked = opt.selected;
    const text = el('span');
    text.textContent = opt.label;
    optionLabel.append(input, text);
    list.append(optionLabel);
    return input;
  });
  wrapper.append(list);

  const errorEl = addHelpAndError(wrapper, id, settings.help);
  describedBy(controls, id, settings.help);
  wrapper.setAttribute('aria-describedby', `${settings.help ? `${id}-help ` : ''}${id}-error`);
  return {
    wrapper,
    record: {
      name, type, label, controls, required, errorEl, customError: settings.error,
    },
  };
}

function buildConsentField(ctx, {
  type, labelCell, label, settings, flags,
}) {
  const name = ctx.uniqueName(settings.name || label);
  const id = ctx.nextId();
  const required = flags.has('required');

  const wrapper = el('div', `${layoutClasses(flags)} is-${type}`);
  const labelEl = el('label', `form-builder-check${type === 'switch' ? ' is-switch' : ''}`, { for: id });
  const input = el('input', '', { type: 'checkbox', id, name });
  if (type === 'switch') input.setAttribute('role', 'switch');
  input.required = required;
  input.checked = flags.has('checked');
  if (settings.value) input.value = settings.value;

  const text = el('span', 'form-builder-check-label');
  if (!moveContent(labelCell, text)) text.textContent = label;
  if (required) {
    const mark = el('span', 'form-builder-required', { 'aria-hidden': 'true' });
    mark.textContent = ' *';
    text.append(mark);
  }
  labelEl.append(input, text);
  wrapper.append(labelEl);

  const errorEl = addHelpAndError(wrapper, id, settings.help);
  describedBy([input], id, settings.help);
  return {
    wrapper,
    record: {
      name,
      type,
      label,
      controls: [input],
      required,
      errorEl,
      customError: settings.error,
      explicitValue: Boolean(settings.value),
    },
  };
}

function buildFileField(ctx, { label, settings, flags }) {
  const name = ctx.uniqueName(settings.name || label);
  const id = ctx.nextId();
  const required = flags.has('required');

  const wrapper = el('div', `${layoutClasses(flags)} is-file`);
  wrapper.append(buildLabel(label, id, required));

  const input = el('input', 'form-builder-control', { id, name, type: 'file' });
  input.required = required;
  input.multiple = flags.has('multiple');
  setIf(input, 'accept', settings.accept);
  wrapper.append(input);

  const errorEl = addHelpAndError(wrapper, id, settings.help);
  describedBy([input], id, settings.help);
  return {
    wrapper,
    record: {
      name,
      type: 'file',
      label,
      controls: [input],
      required,
      errorEl,
      customError: settings.error,
      maxSizeMb: parseFloat(settings.maxsize) || 0,
    },
  };
}

/* ------------------------------------------------------------------ */
/* validation                                                          */
/* ------------------------------------------------------------------ */

function nativeMessage(control, label) {
  const { validity } = control;
  if (validity.valueMissing) return `${label} is required.`;
  if (validity.typeMismatch) {
    return control.type === 'url' ? 'Please enter a valid URL.' : 'Please enter a valid email address.';
  }
  if (validity.patternMismatch) return `${label} does not match the requested format.`;
  if (validity.rangeUnderflow) return `${label} must be ${control.min} or more.`;
  if (validity.rangeOverflow) return `${label} must be ${control.max} or less.`;
  if (validity.stepMismatch) return `${label} is not a valid value.`;
  if (validity.badInput) return `${label} is not a valid value.`;
  return control.validationMessage || `${label} is not valid.`;
}

/** Returns an error message, or '' when the field is valid. */
function validateRecord(record) {
  const { controls, label, type } = record;
  const [first] = controls;

  if (type === 'checkbox-group') {
    return record.required && !controls.some((control) => control.checked)
      ? (record.customError || `Please choose at least one option for ${label}.`)
      : '';
  }

  if (type === 'file') {
    const files = [...(first.files || [])];
    if (record.required && !files.length) return record.customError || `${label} is required.`;
    if (record.maxSizeMb && files.some((file) => file.size > record.maxSizeMb * 1024 * 1024)) {
      return `Each file must be smaller than ${record.maxSizeMb} MB.`;
    }
    return '';
  }

  if (type === 'hidden') return '';

  if ((type === 'checkbox' || type === 'switch') && record.required && !first.checked) {
    return record.customError || 'This box must be checked to continue.';
  }

  if (first.minLength > 0 && first.value && first.value.length < first.minLength) {
    return record.customError || `${label} must be at least ${first.minLength} characters.`;
  }

  if (controls.every((control) => control.checkValidity())) return '';
  return record.customError || nativeMessage(controls.find((c) => !c.checkValidity()), label);
}

function showError(record, message) {
  if (!record.errorEl) return;
  record.errorEl.textContent = message;
  record.errorEl.hidden = !message;
  record.controls.forEach((control) => {
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
  record.wrapper?.classList.toggle('has-error', Boolean(message));
}

/* ------------------------------------------------------------------ */
/* submission                                                          */
/* ------------------------------------------------------------------ */

function collectJson(records) {
  const data = {};
  records.forEach((record) => {
    const { name, type, controls } = record;
    if (type === 'checkbox-group') {
      data[name] = controls.filter((c) => c.checked).map((c) => c.value);
    } else if (type === 'radio') {
      data[name] = controls.find((c) => c.checked)?.value || '';
    } else if (type === 'checkbox' || type === 'switch') {
      const [input] = controls;
      if (record.explicitValue) data[name] = input.checked ? input.value : '';
      else data[name] = input.checked;
    } else if (type === 'select') {
      const [select] = controls;
      data[name] = select.multiple
        ? [...select.selectedOptions].map((o) => o.value)
        : select.value;
    } else if (type === 'file') {
      data[name] = [...(controls[0].files || [])].map((file) => file.name);
    } else if (type === 'number' || type === 'range') {
      const { value } = controls[0];
      data[name] = value === '' ? '' : Number(value);
    } else {
      data[name] = controls[0].value;
    }
  });
  return data;
}

function buildRequest(form, records, settings) {
  const hasFiles = records.some((r) => r.type === 'file' && r.controls[0].files?.length);
  const meta = { submittedAt: new Date().toISOString(), pageUrl: window.location.href };

  if (hasFiles || settings.format === 'multipart') {
    const body = new FormData(form);
    body.delete('form_builder_hp');
    Object.entries(meta).forEach(([key, value]) => body.append(key, value));
    return { body };
  }

  const data = { ...collectJson(records), ...meta };
  if (settings.format === 'form') {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
      else params.append(key, value);
    });
    return {
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    };
  }
  return {
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  };
}

function setStatus(statusEl, message, state) {
  statusEl.textContent = message;
  statusEl.dataset.state = state || '';
  statusEl.hidden = !message;
}

async function send(config, form, records, submitBtn, statusEl) {
  const { actionUrl, buttonLabel, settings } = config;

  if (!actionUrl) {
    setStatus(statusEl, 'This form is not connected yet. Set a "Form action URL" in the editor.', 'error');
    return;
  }

  const defaultText = buttonLabel;
  submitBtn.disabled = true;
  submitBtn.textContent = settings.sending || 'Sending…';
  form.setAttribute('aria-busy', 'true');
  setStatus(statusEl, '', '');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { body, headers } = buildRequest(form, records, settings);
    const response = await fetch(actionUrl, {
      method: 'POST', headers, body, signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

    if (config.redirectUrl) {
      window.location.assign(config.redirectUrl);
      return;
    }
    setStatus(statusEl, config.successMessage, 'success');
    if (settings.reset !== 'false') {
      form.reset();
      form.querySelectorAll('input[type="range"]')
        .forEach((range) => range.dispatchEvent(new Event('reset-output')));
    }
    statusEl.focus();
  } catch (error) {
    setStatus(statusEl, settings.error || DEFAULT_ERROR, 'error');
    // eslint-disable-next-line no-console
    console.error('[form-builder] submit failed:', error);
  } finally {
    clearTimeout(timer);
    form.removeAttribute('aria-busy');
    submitBtn.disabled = false;
    submitBtn.textContent = defaultText;
  }
}

/* ------------------------------------------------------------------ */
/* row parsing                                                         */
/* ------------------------------------------------------------------ */

function kindOf(type) {
  if (INPUT_TYPES.includes(type)) return 'input';
  if (CHOICE_TYPES.includes(type)) return 'choice';
  if (CONSENT_TYPES.includes(type)) return 'consent';
  if (type === 'file') return 'file';
  if (LAYOUT_TYPES.includes(type)) return 'layout';
  if (type === 'settings') return 'settings';
  return 'input'; // unknown / empty type: behave like a text input
}

function buildLayoutElement(type, cells, row) {
  const heading = textOf(cells[1]);
  const bodyCell = cells[2];

  if (type === 'divider') {
    const hr = el('hr', 'form-builder-divider');
    moveInstrumentation(row, hr);
    return hr;
  }

  const body = el('div', 'form-builder-note');
  const hasBody = moveContent(bodyCell, body);

  if (type === 'section') {
    const fieldset = el('fieldset', 'form-builder-section');
    if (heading) {
      const legend = el('legend', 'form-builder-legend');
      legend.textContent = heading;
      fieldset.append(legend);
    }
    if (hasBody) fieldset.append(body);
    const grid = el('div', 'form-builder-grid');
    fieldset.append(grid);
    moveInstrumentation(row, fieldset);
    return { fieldset, grid };
  }

  const wrapper = el('div', `form-builder-field form-builder-${type}`);
  if (type === 'heading' && heading) {
    const h = el('h3', 'form-builder-heading');
    h.textContent = heading;
    wrapper.append(h);
  } else if (heading) {
    const strong = el('p', 'form-builder-note-title');
    strong.textContent = heading;
    wrapper.append(strong);
  }
  if (hasBody) wrapper.append(body);
  moveInstrumentation(row, wrapper);
  return wrapper;
}

function buildFieldFromRow(ctx, row, index) {
  const cells = [...row.children];
  const type = textOf(cells[0]).toLowerCase();
  const kind = kindOf(type);
  const flagsCell = cells[3];
  const label = textOf(cells[1]) || `Field ${index + 1}`;

  if (kind === 'input') {
    const { settings, rest } = parseDetails(linesOf(cells[2]));
    if (rest.length && !settings.placeholder && type !== 'hidden') [settings.placeholder] = rest;
    return buildInputField(ctx, {
      type: INPUT_TYPES.includes(type) ? type : 'text', label, settings, flags: flagsOf(flagsCell),
    });
  }

  if (kind === 'choice') {
    const { settings, rest } = parseDetails(linesOf(cells[2]), true);
    const options = parseOptions(rest);
    const flags = flagsOf(flagsCell);
    if (type === 'select') {
      return buildSelectField(ctx, {
        label, options, settings, flags,
      });
    }
    return buildOptionGroup(ctx, {
      type, label, options, settings, flags,
    });
  }

  if (kind === 'consent') {
    const { settings } = parseDetails(linesOf(cells[2]));
    return buildConsentField(ctx, {
      type, labelCell: cells[1], label: label || 'Checkbox', settings, flags: flagsOf(flagsCell),
    });
  }

  const { settings } = parseDetails(linesOf(cells[2]));
  return buildFileField(ctx, { label, settings, flags: flagsOf(flagsCell) });
}

/* ------------------------------------------------------------------ */
/* decorate                                                            */
/* ------------------------------------------------------------------ */

function createContext(formId) {
  const used = new Map();
  let counter = 0;
  return {
    nextId() {
      counter += 1;
      return `${formId}-f${counter}`;
    },
    uniqueName(raw) {
      const base = slugify(raw) || 'field';
      const count = (used.get(base) || 0) + 1;
      used.set(base, count);
      return count === 1 ? base : `${base}_${count}`;
    },
  };
}

export default function decorate(block) {
  formCounter += 1;
  const formId = `fb${formCounter}`;
  const rows = [...block.children];

  // block-level properties are single-cell rows; item rows always have 3+ cells
  const propRows = [];
  while (rows.length && rows[0].children.length === 1 && propRows.length < 3) {
    propRows.push(rows.shift());
  }
  const [introRow, buttonRow, actionRow] = propRows;
  const buttonLabel = textOf(buttonRow?.firstElementChild) || 'Submit';
  const actionUrl = urlOf(actionRow?.firstElementChild);

  const config = {
    actionUrl,
    buttonLabel,
    successMessage: DEFAULT_SUCCESS,
    redirectUrl: '',
    settings: {},
  };

  const ctx = createContext(formId);
  const records = [];
  const root = el('div', 'form-builder-grid');
  let grid = root;

  const itemRows = rows.filter((row) => row.textContent.trim());
  itemRows.forEach((row, index) => {
    const cells = [...row.children];
    const type = textOf(cells[0]).toLowerCase();
    const kind = kindOf(type);

    if (kind === 'settings') {
      const { settings } = parseDetails(linesOf(cells[3]));
      config.successMessage = textOf(cells[1]) || DEFAULT_SUCCESS;
      config.redirectUrl = urlOf(cells[2]);
      config.settings = settings;
      return;
    }

    if (kind === 'layout') {
      const built = buildLayoutElement(type, cells, row);
      if (built.fieldset) {
        root.append(built.fieldset);
        grid = built.grid;
      } else {
        grid.append(built);
      }
      return;
    }

    const { wrapper, record } = buildFieldFromRow(ctx, row, index);
    record.wrapper = wrapper;
    moveInstrumentation(row, wrapper);
    records.push(record);
    grid.append(wrapper);
  });

  const intro = el('div', 'form-builder-intro');
  const hasIntro = introRow ? moveContent(introRow.firstElementChild, intro) : false;
  if (hasIntro && introRow) moveInstrumentation(introRow, intro);

  block.textContent = '';
  block.classList.add('form-builder');
  if (hasIntro) block.append(intro);

  if (!records.length) {
    const empty = el('p', 'form-builder-empty');
    empty.textContent = 'No form fields yet. Add fields (text, email, dropdown, …) inside this Form Builder.';
    block.append(empty);
    return;
  }

  const formTitle = intro.querySelector('h1, h2, h3, h4')?.textContent.trim() || 'Form';
  const form = el('form', 'form-builder-form', { novalidate: true, 'aria-label': formTitle });

  // honeypot: real people never see or fill this, bots usually do
  const trap = el('div', 'form-builder-trap', { 'aria-hidden': 'true' });
  const trapInput = el('input', '', {
    type: 'text', name: 'form_builder_hp', tabindex: '-1', autocomplete: 'off',
  });
  trap.append(trapInput);

  const actions = el('div', 'form-builder-actions');
  const submitBtn = el('button', 'form-builder-submit button', { type: 'submit' });
  submitBtn.textContent = buttonLabel;
  actions.append(submitBtn);

  const statusEl = el('div', 'form-builder-status', {
    role: 'status', 'aria-live': 'polite', tabindex: '-1', hidden: true,
  });

  form.append(root, trap, actions, statusEl);
  block.append(form);

  // live validation: on leaving a field, and while fixing one that is already flagged
  records.forEach((record) => {
    record.controls.forEach((control) => {
      control.addEventListener('blur', () => showError(record, validateRecord(record)));
      const recheck = () => {
        if (!record.errorEl.hidden) showError(record, validateRecord(record));
      };
      control.addEventListener('input', recheck);
      control.addEventListener('change', recheck);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    setStatus(statusEl, '', '');

    const invalid = records.filter((record) => {
      const message = validateRecord(record);
      showError(record, message);
      return Boolean(message);
    });

    if (invalid.length) {
      const count = invalid.length;
      setStatus(statusEl, `Please fix ${count} field${count > 1 ? 's' : ''} before sending.`, 'error');
      const [firstInvalid] = invalid;
      (firstInvalid.controls.find((c) => !c.checkValidity()) || firstInvalid.controls[0]).focus();
      return;
    }

    // honeypot filled in -> pretend everything worked, send nothing
    if (trapInput.value) {
      setStatus(statusEl, config.successMessage, 'success');
      return;
    }

    send(config, form, records, submitBtn, statusEl);
  });
}
