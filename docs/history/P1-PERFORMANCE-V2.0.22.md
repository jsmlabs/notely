# Notely v2.0.22 — Targeted Performance Pass

## Baseline and change

- Source baseline: local v2.0.21 project.
- Observed hotspot: `preview(note)` normalized up to 100,000 characters for every rendered note card, even though the card displays only a short excerpt.
- Fix: bound preview extraction and whitespace normalization; output at most 180 characters, without changing stored bodies or search behavior.
- Fixture: `scripts/benchmark-preview.mjs`, 1,000 in-memory notes, approximately 20k characters each, 20 warmed runs under Node.js v22.16.0 on the same host.
- Before: median 11.492 ms, p95 16.162 ms (1,000 previews).
- After: median 0.306 ms, p95 0.401 ms (1,000 previews).
- These measurements are exploratory microbenchmarks; heap measurements are not comparable after GC and do not establish RAM reduction. Browser DOM and end-to-end performance remain unverified.

## Verification

- `npm run check`: passed.
- `npm test`: 137/137 passed, including three new bounded-preview tests.
- `python qa-v218-layout.py`: 6/6 static Chromium layout checks passed.
- No added runtime dependency, permission, or note storage schema change.
- Native installed Chrome extension and end-to-end UI lifecycle remain unverified, consistent with the previously deferred acceptance scope.

## Next

Measure DOM rendering and memory with representative datasets before attempting further refactors. Preserve the existing UI lifecycle and storage guarantees.
