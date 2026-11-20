# Notely 2.0.1 - Repair notes

This patch builds on the supplied Notely 2.0.0 project.

Changes:
- `import-selection.mjs`: cancel/ignore superseded asynchronous file reads, including stale failures.
- `popup.js`: guard backup selection and import states, preserve a snapshot for import, avoid redundant save retry, and constrain workspace sidebar width on resize.
- `styles.css`: restore keyboard focus indicators for editor title and body.
- `tests/import-selection.test.mjs`: three real asynchronous ordering and error regression tests.
- `package.json` / `manifest.json`: version 2.0.1; include helper in syntax checks.

Verification: 69 passing Node tests; all declared syntax checks passed. Runtime Chrome flows, downloads, storage persistence in actual browser and visual comparisons are unverified.
