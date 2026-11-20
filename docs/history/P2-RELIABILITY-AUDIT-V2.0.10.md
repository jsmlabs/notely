# Notely v2.0.10 — targeted reliability audit

## Baseline
- Source: v2.0.9 workspace-layout repair.
- Scope: CSS/layout, note persistence, import/replace, keyboard/labels, package consistency.

## Fixes
1. **Stale destructive backup preview:** replace now uses a frozen baseline from when the file was read, disables replacement if notes have since changed, and sends that same baseline to the authoritative service worker. This prevents unrelated captures and edits from being silently replaced after the preview.
2. **Theme button accessible name:** dynamically changes with the actual theme, alongside tooltip.
3. **Startup save status:** do not overwrite an in-flight or failed save with a spurious `Saved` after asynchronous recovery inspection.
4. **Regression checks:** new deterministic import race tests and static UI contract checks; prior workspace layout check retained.

## Evidence limitations
- Node tests and Chromium static layout checks do not exercise a fully installed extension, Chrome storage or service-worker lifecycle.
- No blanket claim of bug-free, WCAG-certified or 10/10 quality.
- The user explicitly skipped installed-extension runtime/accessibility validation; it remains skipped.

## Executed checks (this candidate)
- `npm run check`: PASS (Node 22.16.0).
- `npm test`: PASS, 100/100 test cases.
- `python qa-workspace-layout.py`: PASS at 400, 700, 701, 1024, 1440, 1700 px.
- `python qa-visual-layout-v210.py`: PASS at 280 and 360 px Side Panel, 400 px Popup, and 700/701/1440/1700 px Workspace.
- Screenshots for v2.0.10 are generated from the static HTML and actual CSS and embedded brand SVG. Script-dependent application state is not executed in this static visualization.
- ZIP archive byte consistency is checked separately after creation; this proves neither runtime behavior nor accessibility compliance.

## Remaining limitations
- Live MV3 service-worker lifecycle, installed extension persistence, real Chrome Storage API E2E and screenreader use were not executed. No Chrome Web Store publication.
- Passing tests do not establish absence of all defects or subjective perfection.
