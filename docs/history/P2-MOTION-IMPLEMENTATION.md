# Notely v2.0.11 — Lightweight Motion

## Scope

- Shared `motion.css` loaded after `styles.css` in all three surfaces.
- Hover/selected/focus color transitions (110–160 ms), no layout-changing motion.
- One-shot dialog, notice, recovery banner and empty-state icon entrances (190 ms).
- Existing editor, caret, scrolling and resize behavior remains unanimated.
- Global `prefers-reduced-motion: reduce` disables animations/transitions.
- No JavaScript timers, animation dependencies, `will-change`, infinite loops or backdrop filters.

## Verification contract

- Run `npm run check` and `npm test` on staged v2.0.11.
- Test shared stylesheet loading, motion duration, keyframe ownership and reduced-motion styles.
- If Playwright/Chromium are available, inspect computed animation and transitions in real renders, including reduced motion.
- Visual/technical acceptance does not imply measured lower memory usage; memory before/after requires controlled runtime profiling.
- Chrome extension install/storage/service-worker verification remains skipped as requested in previous scope.

## Executed verification (2026-11-20)

- `npm run check`: PASS, JavaScript syntax for the defined project scripts.
- `npm test`: 103/103 PASS (100 baseline + 3 motion regressions).
- `python qa-motion.py`: PASS for popup 400 px, side panel 280 px, workspace 1440 px, each in normal and reduced-motion modes (6 combinations).
- Computed styles verified for empty-state entrance, dialog entrance, notice entrance, button transitions and reduction behavior. No document-level horizontal overflow in these six scenarios.
- Chromium loaded the original HTML/CSS through `set_content` after stripping scripts and external links; this is **static layout and CSS validation**, not a functioning installed extension. `file://` direct navigation was blocked by administrator policy.
- No measured memory/CPU benchmarks; low-overhead design is architectural, not a quantified runtime improvement.
