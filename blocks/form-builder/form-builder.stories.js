import decorate from './form-builder.js';
import './form-builder.css';

export default {
  title: 'Blocks/Form Builder',
};

/*
 * Mirrors what the Edge Delivery pipeline hands to decorate():
 *  - block-level properties: three single-cell rows (intro, button label, action URL)
 *  - one row per child item. Cell 1 is always the item "type":
 *      form-input    type | label | details   | flags
 *      form-choice   type | label | options   | flags
 *      form-consent  type | label | details   | flags
 *      form-file     type | label | details   | flags
 *      form-section  type | heading | body
 *      form-settings type | success message | redirect URL | details
 *  - "flags" = the collapsed classes_* group, e.g. "required, half"
 *  - multi-line values arrive as paragraphs inside the cell
 */
function cell(value) {
  const div = document.createElement('div');
  if (value === undefined || value === null || value === '') return div;
  String(value).split('\n').forEach((line) => {
    const p = document.createElement('p');
    p.textContent = line;
    div.append(p);
  });
  return div;
}

function row(...values) {
  const div = document.createElement('div');
  values.forEach((value) => div.append(cell(value)));
  return div;
}

function buildBlock({
  intro = '', buttonLabel = 'Submit', actionUrl = '', variant = '', items = [],
}) {
  const block = document.createElement('div');
  block.className = `form-builder block ${variant}`.trim();
  const introRow = row('');
  introRow.firstElementChild.innerHTML = intro;
  block.append(introRow, row(buttonLabel), row(actionUrl));
  items.forEach((item) => block.append(row(...item)));
  return block;
}

// Fake endpoint so the stories can "send" without a backend.
function mockFetch() {
  window.fetch = () => new Promise((resolve) => {
    setTimeout(() => resolve({ ok: true, status: 200 }), 600);
  });
}

export const ContactForm = () => {
  mockFetch();
  const block = buildBlock({
    intro: '<h2>Contact us</h2><p>We usually reply within one business day.</p>',
    buttonLabel: 'Send message',
    actionUrl: 'https://example.com/api/contact',
    variant: 'boxed',
    items: [
      ['text', 'First name', 'placeholder: Ada\nautocomplete: given-name', 'required, half'],
      ['text', 'Last name', 'placeholder: Lovelace\nautocomplete: family-name', 'required, half'],
      ['email', 'Email', 'placeholder: you@example.com\nhelp: We never share your email.', 'required'],
      ['tel', 'Phone', 'placeholder: +1 555 0100\npattern: [0-9\\s+\\(\\)\\-]{7,}\nerror: Enter a valid phone number.', 'half'],
      ['select', 'Topic', 'Sales\n*Support\nPartnership\n@name: topic', 'required, half'],
      ['textarea', 'Message', 'rows: 5\nminlength: 20\nhelp: At least 20 characters.', 'required'],
      ['checkbox', 'I agree to be contacted about my request.', '', 'required'],
      ['settings', 'Thanks - we will be in touch shortly!', '', ''],
    ],
  });
  decorate(block);
  return block;
};

export const JobApplication = () => {
  mockFetch();
  const block = buildBlock({
    intro: '<h2>Apply now</h2>',
    buttonLabel: 'Submit application',
    actionUrl: 'https://example.com/api/apply',
    items: [
      ['section', 'About you', '', ''],
      ['text', 'Full name', '', 'required, half'],
      ['email', 'Email', '', 'required, half'],
      ['url', 'Portfolio URL', 'placeholder: https://', 'half'],
      ['date', 'Available from', '', 'half'],
      ['section', 'Role', 'Tell us what you are looking for.', ''],
      ['radio', 'Employment type', 'Full-time\nPart-time\nContract\n@help: Pick the closest match', 'required, inline'],
      ['checkbox-group', 'Skills', 'JavaScript\nCSS\nAccessibility\nAEM', 'inline'],
      ['range', 'Years of experience', 'min: 0\nmax: 20\ndefault: 3', ''],
      ['file', 'CV', 'accept: .pdf,.doc,.docx\nmaxsize: 5\nhelp: PDF or Word, up to 5 MB', 'required'],
      ['switch', 'Keep me in mind for future roles', '', 'checked'],
    ],
  });
  decorate(block);
  return block;
};

export const EventRegistration = () => {
  mockFetch();
  const block = buildBlock({
    intro: '<h2>Event registration</h2>',
    buttonLabel: 'Register',
    actionUrl: 'https://example.com/api/register',
    variant: 'compact',
    items: [
      ['text', 'Full name', '', 'required'],
      ['email', 'Email', '', 'required'],
      ['number', 'Guests', 'min: 0\nmax: 5\ndefault: 1', 'half'],
      ['select', 'Session', '*am | Morning\npm | Afternoon\n@placeholder: Choose a session', 'required, half'],
      ['hidden', 'source', 'default: website', ''],
      ['settings', 'You are registered!', '', 'format: form'],
    ],
  });
  decorate(block);
  return block;
};

export const NotConnected = () => {
  // No action URL: submitting shows a helpful message instead of failing silently.
  const block = buildBlock({
    intro: '<h2>Newsletter</h2>',
    buttonLabel: 'Subscribe',
    items: [['email', 'Email', 'placeholder: you@example.com', 'required']],
  });
  decorate(block);
  return block;
};

export const EmptyBlock = () => {
  const block = buildBlock({ intro: '<h2>Untitled form</h2>' });
  decorate(block);
  return block;
};
