## Epic 1 — Extension Bootstrap & Site Activation

**Objective**
Configure the extension to run silently with no visible browser-action icon and to activate exclusively on www.philibertnet.com pages for the v1.0.0 scope.

**In scope**
- Removing the browser action icon (and any popup) from the extension manifest
- Narrowing the content script URL match patterns to www.philibertnet.com only
- Ensuring no other URL patterns remain active for this v1.0.0 release

**Stories**

### Story 1.1 — Remove the browser action icon and popup entry from the extension manifest
The `action` key in `manifest.json` contains no `default_icon` and no `default_popup`; the extension icon does not appear in the Chrome toolbar when installed.

### Story 1.2 — Restrict the content script URL matching to www.philibertnet.com pages only
The `content_scripts[].matches` array in `manifest.json` contains exactly one entry — `https://www.philibertnet.com/*`; the content script does not inject on any other domain.
