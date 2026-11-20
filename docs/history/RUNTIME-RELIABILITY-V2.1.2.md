# Notely v2.1.2 — Runtime Reliability & Interaction Regression

**Local candidate; not published or tested as an installed Chrome extension.** Based on v2.1.1.

## Reproduced / code-confirmed issues and repairs

1. **Stale backup import after closing dialog:** `File.text()` completes asynchronously. Previously, closing the backup dialog did not invalidate the pending file-selection revision; a late result could populate the import preview after the dialog closed. The `close` handler now invalidates outstanding reads and clears the staged backup, replacement confirmation, selected file, preview and result. Reopening requires a fresh selection. Closing is blocked while a commit is active as before.
2. **Support exit animation completion failure:** Previously an exception while accessing `animation.finished` or calling `animation.cancel()` could prevent native close. The finish handler now has an exception-safe fallback and always clears the active animation handle before closing. Existing reduced-motion and repeated-open behavior remains intact.

## Executed checks on this candidate

- `npm run check` — passed.
- `npm test` — 143/143 passed, including 3 new deterministic source/selection regression cases.
- `npm run audit:release` — passed; 7 manifest resources, 19 HTML resources, 7 PNG assets, 3 release docs.
- `python scripts/qa-runtime-dialogs.py` — 4 Chromium configurations (400×580 and 280×650 px; with/without reduced motion). Actual HTML/CSS + extracted **unchanged Support and Backup handlers**; 3 support open/close cycles per configuration, Escape path and backup-reset checked. This is not the complete popup entrypoint.

## Runtime and data boundaries

- Full navigation of `popup.html` over localhost returned `ERR_BLOCKED_BY_ADMINISTRATOR`. No full-page Chrome UI, installed MV3 runtime or real Chrome Storage lifecycle was verified.
- Autosave, coordinator concurrency, import and recovery retain the earlier Node simulation tests. Those pass as part of 143/143, but they are not actual multi-window Chrome integration tests.
- No new dependencies, extension permissions, storage-key migrations, backup format changes or donation address changes.
- Chrome Web Store submission and full accessibility acceptance remain unverified/deferred.

## Release acceptance

The listed local regression and packaging gates passed; **production readiness is not established** until a genuine installed-extension acceptance is available and authorized.
