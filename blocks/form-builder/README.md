# Form Builder

Author any form in the Universal Editor: add a **Form Builder** block, then add fields inside it.

## Block properties
| Field | Meaning |
|---|---|
| Intro | Heading + description shown above the form |
| Submit button label | Defaults to "Submit" |
| Form action URL | Where the form is POSTed. Without it the form shows a "not connected" message and sends nothing |
| Boxed / Compact / Full width | Look-and-feel flags (added as CSS classes) |

## Items you can add
Text, Email, Phone, Number, Date, Long answer, Other input (url, password, time, month, colour, range, hidden), Dropdown, Radio buttons, Checkbox group, Single checkbox / consent, Toggle switch, File upload, Section (fieldset + legend), Heading, Note, Divider, and Form settings.

Every field has a **Label**, and flags (Required, Half width, One third width, ...).

## The "settings" text box
Inputs, consent, file and settings items have a multi-line box. One setting per line as `key: value`:

```
placeholder: you@example.com
help: We never share your email.
name: work_email
default: hello
pattern: [0-9\s+\(\)\-]{7,}
min: 0
max: 20
step: 1
minlength: 20
maxlength: 200
rows: 5
autocomplete: email
error: Custom message shown when this field is invalid
accept: .pdf,image/*      (file)
maxsize: 5                (file, in MB)
value: yes                (checkbox/switch: submitted value; otherwise true/false)
```

**Dropdown / Radio / Checkbox group** use the *Options* box: one option per line.
`*Support` marks the default, `us | United States` submits `us` but shows "United States".
Settings in that box start with `@` (e.g. `@help: Pick one`, `@placeholder: Choose...`, `@name: country`).

**Form settings** (add at most one): success message, redirect URL, and
`format: json | form`, `error: ...`, `sending: ...`, `reset: false`.

## Submission
* JSON by default (`format: form` for urlencoded). Automatically multipart when a file is chosen.
* Extra keys added: `submittedAt`, `pageUrl`. Field keys come from the label (snake_case) unless `name:` is set.
* Hidden honeypot field; bots that fill it get a fake success and nothing is sent.
* 15 s timeout, button disabled while sending, accessible errors (`aria-invalid`, `aria-describedby`, live status region).

## Why it is built this way (lint rules)
`xwalk/max-cells` allows 4 cells per model, and `xwalk/no-orphan-collapsible-fields` forbids names ending in
`Title`, `Type`, `Text`, `Alt`, `MimeType` unless the base field exists (e.g. `fieldType` is an orphan).
So: several small item models (<= 4 cells each), a `type` first cell that tells the script what a row is,
the `classes_*` boolean group (counts as ONE cell) for flags, and a `details` text box for the long tail.
