import decorate from './trip-booking-form.js';
import './trip-booking-form.css';

export default {
  title: 'Blocks/Trip Booking Form',
};

// EDS hands each block a <div> whose children are "rows"; each row here
// corresponds to one authorable field, in the order defined in the model:
// Title, Description, Submit Button Label, Form Action URL.
function buildBlock({
  title, description, buttonLabel, actionUrl,
} = {}) {
  const block = document.createElement('div');
  block.className = 'trip-booking-form block';

  const rows = [title, description, buttonLabel, actionUrl];
  rows.forEach((value) => {
    const row = document.createElement('div');
    const cell = document.createElement('div');
    cell.innerHTML = value ? `<p>${value}</p>` : '';
    row.append(cell);
    block.append(row);
  });

  return block;
}

export const Default = () => {
  const block = buildBlock({
    title: 'Book Your Trip to Japan',
    description: 'Tell us your travel plans and our team will get back to you with the best fares.',
    buttonLabel: 'Book Now',
    actionUrl: 'https://jsonplaceholder.typicode.com/posts',
  });
  decorate(block);
  return block;
};

export const MinimalAuthoring = () => {
  // No fields configured by the author - block still renders with sane defaults.
  const block = buildBlock({});
  decorate(block);
  return block;
};
