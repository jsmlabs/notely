# Notely v2.0.14 — Donation UX Refinement

## Changed
- Full receiving address appears in both entry views even at narrow widths. The original read-only input remains to support selection/copy.
- Clipboard copy operation uses per-dialog session guard: late completion cannot overwrite a newly opened dialog or an already closed dialog.
- Copy button shows pending and copied states; failures select the address for manual copying.
- No new runtime dependencies, Chrome permissions, tracking, wallet access, or payments.

## Checks executed
- `npm run check`: PASS
- `npm test`: PASS (110 of 110)
- Static Chromium dialogs: 280px side panel, 400px popup, 1440px workspace: PASS; QR loaded and no document horizontal overflow.
- Clipboard async race, success and error paths tested using extracted actual handler source in Node.

## Scope limits
These are static Chromium layout checks, not installed Chrome extension runtime tests. Binance deposit availability and acceptance were not verified; no actual transfer occurred.
