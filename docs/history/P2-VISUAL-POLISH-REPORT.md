# Notely P2 — Visual Polish & Component Consolidation (v2.0.7)

## Scope

Refined typography, component spacing and visual rhythm across popup, Chrome side panel and full workspace, using the existing shared `styles.css` and semantic `design-tokens.css`. Existing markup, scripts, storage behavior, extension permissions and functionality are unchanged.

## Source changes

- Added semantic typography, line-height, weight and spacing tokens.
- Applied shared reading sizes to note cards, search, filters, editor and supporting text.
- Harmonized note-list padding and metadata rhythm, toolbar gaps, dialog buttons and component radii.
- Removed redundant brand-period and duplicate root-font declarations.
- Retained narrow-view adjustments and reduced-motion support.
- Preserved the earlier colors and brand identity; no speculative features added.

## Acceptance boundaries

Automated Node tests, syntax checks and ZIP integrity can be verified locally. Static Chromium screenshots are not a substitute for loading the actual Chrome extension; Chrome APIs and runtime interactions are not claimed validated. The explicitly skipped runtime/accessibility gate remains skipped.

## Verification (local)

- `npm test`: 89 of 89 passing, including 3 new visual-token contract checks.
- `npm run check`: JavaScript syntax check passed.
- Chromium static HTML/CSS render at 280/360/400/700/701/1440 px: no page-level horizontal overflow; 14 px rendered note-title and editor text. The test fixture inserts one sample note row and uses `popup.html` as the full-workspace source, with `workspace` body class; scripts and Chrome APIs are not executed.
- Screenshots: `qa-screenshots/notely-v207-{popup-400,sidepanel-280,panel-1440}.png`. They are static fixture images, not evidence of an installed extension.
- A historical `panel.html` is kept unchanged; the current full workspace is opened as `popup.html?workspace=1`.
- Real Chrome-extension runtime, storage recovery, screen-reader, and installed-extension UI acceptance remain unverified / previously skipped as requested.
