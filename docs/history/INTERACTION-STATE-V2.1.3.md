# Notely v2.1.3 — Interaction State & Data Consistency

## Scope
Follow-up to v2.1.2. Scoped recovery-save concurrency repair; no changes to storage keys, backup schema, the donation address, Chrome permissions, or runtime dependencies.

## Verified finding and repair
A draft recovery waits for an asynchronous persistence acknowledgement. Previously, `discardRecovery()` and `applyImport()` could execute during that wait. This allowed a user to discard the recovery source before its copy was confirmed saved, or to start a competing import. Recovery now makes Discard and Import unavailable while it is in flight, and both handlers reject concurrent execution independently of their disabled UI controls. The backup dialog cannot be opened during an in-progress recovery. Completion, including save failures, restores controls and recomputes import availability. The recovery source draft is deleted only after confirmed persistence.

## Actual execution
- `npm run check`: passed.
- `npm test`: 145/145 passed, including two new integration-style lifecycle tests that evaluate the actual recovery UI handlers with controlled deferred persistence and simulated Chrome storage.
- `npm run audit:release`: passed (manifest v2.1.3; resource and release-document checks).
- `python scripts/qa-runtime-dialogs.py`: 4/4 browser/DOM configurations passed; repeated Support open/close and Backup reset checked.
- Full project ZIP: CRC and per-file SHA-256 match against the tested source tree.

## Limits
Node tests exercise simulated Chrome storage and controlled async flows. The four Chromium DOM scenarios do not run the fully installed Chrome MV3 extension. Native extension storage events, real multi-window editing, screenreader acceptance and Chrome Web Store publishing remain unverified. This release fixes the specific reproduced concurrent recovery action; it is not a claim that all state/data races are eliminated.
