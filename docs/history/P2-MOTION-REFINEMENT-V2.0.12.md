# Notely v2.0.12 — Motion visibility refinement

## Change

The empty-state entrance is now scoped to the *visible* editor. Compact list views do not trigger the entrance prematurely. Desktop workspace still shows its empty editor and entrance at widths >= 701px. No JavaScript, storage contract, permissions or dependencies changed.

## Checks

- `npm run check`
- `npm test`
- `python qa-motion-visibility.py`: computed animation state and overflow at popup 400, side panel 280, workspace 700/701/1440, both normal and reduced-motion modes.

Tests rely on static Chromium rendering, not an installed Chrome extension; no memory or CPU benchmark performed.

## Executed results

- `npm run check`: PASS.
- `npm test`: 104/104 PASS.
- `python qa-motion.py`: PASS in 6 normal/reduced CSS combinations.
- `python qa-motion-visibility.py`: PASS in 10 normal/reduced CSS combinations.
- Project files in the final ZIP are checked byte-for-byte against the staged source.
- No installed-extension runtime, screenreader or RAM/CPU benchmark was executed.
