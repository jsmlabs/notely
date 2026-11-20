# Notely — Development Roadmap

**Local candidate:** v2.1.3 (2026-11-20). **Publication:** not released to the Chrome Web Store.

## Completed and locally verified

- [x] P0 v2.0.18 — Protect corrupted persisted notebooks against silent normalization and overwrites; missing initial storage remains supported.
- [x] P0 v2.0.18 — Reject recovery-ID collisions unless they refer to an already recovered matching draft.
- [x] P0 v2.0.18 — Block local note mutations while an asynchronous backup import commits; restore UI controls on success or failure.
- [x] P0 v2.0.18 — Deterministic coordinator, import, recovery and storage-boundary regression tests.
- [x] P0 v2.0.18 — JavaScript syntax, Node test suite and static Chromium layout checks.

- [x] P0 v2.0.20 — Repair Support reopen after completed closing Web Animation; verify repeated native-dialog lifecycle in Chromium.
- [x] P0 v2.0.21 — Prevent unrelated external captures from resetting the active editor/caret; reject corrupt external storage snapshots without changing current UI state.
- [x] P0 v2.0.21 — Add Web Animations failure fallback for Support exit and deterministic coordinator, storage and autosave concurrency cases (134/134 Node tests).
- [x] P0 v2.0.21 — Verify six static Chromium layouts, repeated Support modal lifecycle and failed-animation fallback. Native installed Chrome remains unverified.

## Planned

- [x] P1 v2.0.19 — Bounded responsive workspace, side-panel footer and editor-toolbar refinement (verified in static Chromium).
- [x] P1 v2.0.22 — Benchmark and reduce full-body work during list-preview generation on 1,000 representative large notes (Node workload; not a browser DOM or memory benchmark).
- [ ] P1 future — Browser DOM-render, memory and CPU profiling with the same note library; optimize only proven bottlenecks.
- [x] P1 v2.0.23 — Bounded CSS/JS consolidation: remove superseded workspace rules and centralize word-count UI updates, with 36 paired computed-style Chromium checks; browser extension lifecycle remains unverified.
- [x] P1 v2.1.0 — Release-candidate archive, manifest/asset audit, listing and disclosure draft.
- [x] v2.1.1 — Release audit hardening, version parity and resource-ref negative tests; local checks only.
- [x] v2.1.3 — Guard recovery against concurrent discard and backup import while persistence is pending, including failure/retry state cleanup; 145/145 tests passed.
- [x] v2.1.2 — Reset stale backup-import selections on dialog close and harden Support animation completion; Node tests and scoped Chromium dialog cycles passed (full Chrome entrypoint blocked).
- [ ] v2.1.x publishing gates — Installed MV3 runtime, authentic Store screenshots, final external privacy/support links, developer account disclosure and actual submission.
- [ ] P2 v2.2.0 — User-value-driven navigation and editor enhancements.

## Deferred or unverified gates

- [ ] Native installed Chrome MV3 smoke tests, actual multi-window concurrency and local-storage lifecycle.
- [ ] Full screenreader and accessibility acceptance (previously explicitly skipped).
- [ ] Real user downloads/imports and Chrome Web Store publication.

No new runtime dependencies or permissions; stored note key `notely.notes.v1` and backup format v1 remain unchanged. The Node tests use simulated storage and do not certify native extension runtime.
