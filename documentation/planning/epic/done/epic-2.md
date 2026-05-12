## Epic 2 — Game Title Detection & Visual Confirmation

**Objective**
When the extension activates on a Philibertnet product page, it locates the board game title in the DOM and visually marks it with a blue underline so that correct detection can be verified at a glance.

**In scope**
- Analysing the Philibertnet product page DOM structure to identify the element that holds the game title
- Implementing extraction logic inside the content script to read the title text
- Applying a blue underline style to the detected title element
- Handling pages where no title element is found without throwing errors

**Stories**

### Story 2.1 — Identify and extract the board game title from a Philibertnet product page
Given a Philibertnet product page, the content script correctly reads the board game title text from the expected DOM element and makes it available for downstream processing (e.g. stored in a variable or logged to the console).

### Story 2.2 — Apply a blue underline style to the detected title element in the DOM
After successful detection, the title element in the DOM has `text-decoration: underline` and `text-decoration-color: blue` (or equivalent) applied; the underline is visible on the live page.

### Story 2.3 — Handle gracefully the case where no title element is found on the page
When the content script runs on a page where the expected title element is absent, it logs a descriptive warning message and exits without throwing an uncaught exception or modifying any other DOM element.
