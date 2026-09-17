import decorate from './form-builder.js';
import './form-builder.css';

export default {
  title: 'Blocks/Form Builder',
};

// EDS hands each block a <div> whose children are "rows". The first five
// rows map to the top-level model fields (Title, Description, Submit Button
// Label, Success Message, Form Action URL), in that order. Every row after
// that is one instance of the repeatable "Form fields" container - each of
// those rows has one cell per sub-field, again in model order: fieldLabel,
// fieldName, fieldType, placeholder, options, defaultValue, required.
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
  title, description, buttonLabel, successMessage, actionUrl, fields = [],
} = {}) {
  const block = document.createElement('div');
  block.className = 'form-builder block';

  [title, description, buttonLabel, successMessage, actionUrl].forEach((value) => {
    block.append(buildRow([value]));
  });

  fields.forEach((field) => {
    block.append(buildRow([
      field.label,
      field.name,
      field.type,
      field.placeholder,
      field.options ? field.options.join(', ') : '',
      field.defaultValue,
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
    successMessage: 'Thanks! We\'ll email you the event details.',
    actionUrl: 'https://jsonplaceholder.typicode.com/posts',
    fields: [
      {
        label: 'Full name', name: 'name', type: 'text', required: true,
      },
      {
        label: 'Email', name: 'email', type: 'email', required: true,
      },
      {
        label: 'Session',
        name: 'session',
        type: 'select',
        options: ['Morning', 'Afternoon', 'Evening'],
        required: true,
      },
      {
        label: 'How did you hear about us?', name: 'source', type: 'textarea', required: false,
      },
      {
        label: 'Subscribe to updates', name: 'subscribe', type: 'checkbox', defaultValue: 'true',
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
