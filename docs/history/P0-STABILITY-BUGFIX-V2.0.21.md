# Notely v2.0.21 — Stability & Bugfix Report

## Scope and provenance

- Starting source: `/mnt/data/notely-support-reopen-fix-v2.0.20` (v2.0.20 local candidate).
- Final candidate: this directory, version 2.0.21; no external release or store publication.
- Platform: Manifest V3 Chrome extension, vanilla JavaScript, unchanged permissions and persistence schema.

## Confirmed code defects and repairs

1. **Active-editor caret reset on unrelated remote capture.** The `chrome.storage.onChanged` listener called `renderEditor()` for every remote snapshot, even if the active note remained unchanged. `renderEditor()` assigns textarea `.value`, resetting caret/selection. Now a content comparison of the active note prevents irrelevant editor re-renders while still refreshing genuinely changed active notes.
2. **Lossy adoption of corrupt remote storage.** The listener previously called `normalizeNotes()` directly. That function drops invalid or duplicated IDs and truncates oversized fields. An external corrupt storage snapshot could therefore replace the visible notebook with a lossy one. The listener now invokes the same fail-closed persisted-notebook validator used by the coordinator, keeps the previous state and displays an error for invalid records.
3. **Support exit can trap the modal if Web Animations API throws.** Existence of `.animate` does not guarantee invocation succeeds. It now falls back to native `dialog.close()` when animation creation throws, preserving reopen behavior.

## Regression coverage

- `npm run check`: passed.
- `npm test`: 134/134 passed (6 new tests across active-note changes, storage corruption, pending edits/import and autosave scheduling; all previous 128 tests also pass).
- `python qa-v218-layout.py`: 6/6 static Chromium views without document overflow (400px popup, 280/360px sidepanel, 700/701/1440px workspace).
- `python qa-stability-reopen.py`: repeated Support open/close across normal and reduced motion, 400x580.
- `python qa-support-waapi-fallback.py`: throwing Web Animations API, native close, reopen, Escape.
- Attempt to load full extension HTML/JS with local HTTP/file navigation in sandboxed Chromium was blocked by browser administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). This is **not** a passed integration test.

## Compatibility, limitations, next steps

- Stored notes key, backup format, existing UI surfaces, donation payload and Chrome manifest permissions remain unchanged.
- Tests use Node-managed mocks and static/DOM Chromium harnesses. They do not exercise an installed MV3 Chrome extension, real `chrome.storage` lifecycle, native multi-window concurrency, keyboard/screenreader end-to-end acceptance or hardware performance.
- Next step: representative performance benchmark and bounded codebase cleanup after further real-user bug reports.
