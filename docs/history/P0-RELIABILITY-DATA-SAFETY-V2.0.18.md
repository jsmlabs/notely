# Notely v2.0.18 — Reliability & Data Safety

## Source and scope

Base: `/mnt/data/notely-audit-repaired-v2.0.17`, inspected and copied without altering the original. Changed `coordinator.mjs`, `draft-recovery.mjs`, `popup.js`, versions in `package.json` and `manifest.json`, `README.md`, `ROADMAP.md`; added `tests/reliability-v218.test.mjs` and `qa-v218-layout.py`.

## Repaired failures

1. **Silent data loss during normalization.** Previously the storage coordinator treated a non-array stored payload as `[]` and silently dropped invalid/duplicate notes; subsequent writes could overwrite preserved but unreadable data. Now read/write paths fail closed, while undefined (first-run) storage still starts empty. Oversized IDs/title/body fail closed instead of truncating on write. This safeguards raw storage; it does not automatically repair malformed notes.
2. **Concurrent local editing during import.** The import UI previously disabled only file and confirmation controls; note creation/editing could continue while the asynchronous import response later replaced the UI snapshot. Now note mutation controls and callback/shortcut paths are locked until the import resolves, including error exit. The service worker continues to serialize imports with captures and edits from other windows.
3. **Recovery retry ID collision.** Previously any existing recovery-copy ID was accepted as a completed retry; now unrelated notes with that ID are rejected without modification.

## Executed checks

- `npm run check` — PASS (Node JavaScript syntax checks).
- `npm test` — PASS, **125/125** tests, including eight new deterministic tests (first-install, malformed storage, duplicate IDs, stale conflicts, serialized capture/import, recovery collision, import lock and oversized fields).
- `python qa-v218-layout.py` — PASS **6/6** Chromium HTML/CSS layout scenarios: 400px popup, 280/360px side panel and 700/701/1440px workspace. Static HTML/CSS only; extensions disabled.
- No new runtime dependency, manifest permission or storage schema change.

## Limitations / follow-ups

- No installed Chrome extension test, real Chrome Storage, multi-window UI integration test, screenreader test or performance benchmark was executed.
- Corrupt persisted data intentionally fails closed; users should export/repair it separately rather than allowing silent destructive normalization.
- Passing simulation/unit tests do not certify that the extension has been published or operates correctly in every target browser.
