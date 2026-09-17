import decorate from './form-builder.js';
import './form-builder.css';

export default {
  title: 'Blocks/Form Builder',
};

// EDS hands each block a <div> whose children are "rows". The first four
// rows map to the top-level "form-builder" model fields (Title, Description,
// Submit Button Label, Form Action URL), in that order. Every row after that
// is one "Form Field" child item - each has one cell per sub-field, again in
// model order: label, type, options (dual-purpose: choices for
// Dropdown/Radio, or the default value for anything else), required.
function buildRow(cellValues) {
  const row = document.createElement('div');
  cellValues.forEach((value) => {
    const cell = document.createElement('div');
    cell.innerHTML = value !== undefined && value !== null ? `<p>${value}</p>` : '';
    row.append(cell);
  });
  return row;
}

function buildBlock({
  title, description, buttonLabel, actionUrl, fields = [],
} = {}) {
  const block = document.createElement('div');
  block.className = 'form-builder block';

  [title, description, buttonLabel, actionUrl].forEach((value) => {
    block.append(buildRow([value]));
  });

  fields.forEach((field) => {
    block.append(buildRow([
      field.label,
      field.type,
      field.options,
      field.required ? 'true' : 'false',
    ]));
  });

  return block;
}

export const AuthoredRegistrationForm = () => {
  const block = buildBlock({
    title: 'Event Registration',
    description: 'Author-defined form - built entirely from the block model, no template markup.',
    buttonLabel: 'Register',
    actionUrl: 'https://jsonplaceholder.typicode.com/posts',
    fields: [
      { label: 'Full name', type: 'text', required: true },
      { label: 'Email', type: 'email', required: true },
      {
        label: 'Session', type: 'select', options: 'Morning, *Afternoon, Evening', required: true,
      },
      { label: 'How did you hear about us?', type: 'textarea', required: false },
      {
        label: 'Subscribe to updates', type: 'checkbox', options: 'true', required: false,
      },
    ],
  });
  decorate(block);
  return block;
};

export const MinimalAuthoring = () => {
  // No field items configured yet - block still renders a helpful message.
  const block = buildBlock({ title: 'Untitled Form' });
  decorate(block);
  return block;
};
