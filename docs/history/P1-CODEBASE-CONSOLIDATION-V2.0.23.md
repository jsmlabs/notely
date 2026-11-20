# Notely v2.0.23 — Codebase Consolidation & Maintainability

## Scope and evidence

Based on the actual unpacked v2.0.22 local candidate; local source/archive release only. No native installed-Chrome verification was performed.

## Changes

- Removed four superseded or duplicated CSS declarations for small workspace layouts, focus-mode editor sizing and resize-hover colors. Retained the authoritative later workspace grid and responsive rules; no HTML, routes or public selectors were deleted.
- Consolidated the two UI word-count updates in `popup.js` into one internal helper (`updateWordCount`), avoiding two redundant counts per update and preserving singular/plural copy.
- Updated manifest/package version declarations and README/ROADMAP.
- Preserved storage key `notely.notes.v1`, backup schema, extension permissions, all donation data and runtime dependency set.

## Executed verification

- Baseline v2.0.22 `npm run check` and `npm test`: 137/137 passing.
- Exact v2.0.23 `npm run check` and `npm test`: 137/137 passing.
- Chromium computed-style comparison, locally inlined original stylesheets: 36 scenario pairs (popup, sidepanel, panel × 6 viewport sizes × 2 motion modes); 17 selectors and 19 CSS properties considered, no differences observed. This is a static rendering check with scripts removed, **not** a live Chrome-extension test or screenshot review.
- Artifact check: ZIP CRC, file count and SHA-256 of each archived file against the staged candidate (see release output).

## Remaining gates

- Installed Chrome MV3 lifecycle, Storage API, true multi-window testing and full accessibility acceptance remain unverified/skipped by scope.
- Full CSS cascade equivalence is not proven outside the sampled selectors, properties and viewport combinations.
- No CPU/RAM improvements are claimed; maintainability is the goal of this release.
