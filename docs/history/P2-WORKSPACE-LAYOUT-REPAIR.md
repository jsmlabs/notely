# Notely v2.0.9 — Workspace layout regression repair

## Verified cause
The real full workspace opens `popup.html?workspace=1` (not `panel.html`). Its `.app` contains three grid items: `.sidebar`, `#sidebar-resize`, and `.editor-area`. The v2.0.8 desktop CSS override declared **two** tracks, which forced the editor into an implicit second row. The earlier visual check used `panel.html`, which has no resizer, and thus missed the failure.

## Fix
- Restored three explicit desktop grid tracks: sidebar width, 6px resizer, `minmax(0,1fr)` editor.
- Kept focus mode single-track and <=700px single-view semantics.
- Added a Chromium regression for the **real** `popup.html?workspace=1` markup and measured sidebar, resizer and editor positions at desktop and mobile breakpoints.
- No business logic, permissions, or stored data changes.

## Verification
Run `npm test`, `npm run check` and `python qa-workspace-layout.py` from the project root in an environment with Python Playwright and Chromium installed. The standalone browser script uses real extension HTML/CSS but disables runtime scripts and does not claim to validate extension storage or service workers.
