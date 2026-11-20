# Notely 2.0.13 — Optional USDC Donations

## Implementation
- Optional **Support** action in sidebar footer of popup and side panel; full workspace reuses popup.
- Native accessible donation dialog, local QR image, full read-only address, copy button with manual-selection fallback.
- Address verified from the user-provided Binance USDC Solana deposit QR and independently decoded from the newly generated plain QR.
- Explicit warning to send **USDC on Solana only** and to verify Binance deposit compatibility and limits before sending.
- No payment execution, wallet connection, remote requests, analytics, added Chrome permissions, or runtime libraries.

## Actual verification
- `npm test`: 107/107 passed.
- `npm run check`: JavaScript syntax passed.
- QR decoding: original and generated QR both matched address.
- Chromium static UI with exact donated JS handlers evaluated at 280, 360, 400, and 1440 px: dialog open, QR loading, Escape, focus restoration, on-screen dialog geometry passed.
- Browser did not run Chrome extension service worker/storage integration. Clipboard success was not tested with an installed extension.

## Operational caveat
The destination is a Binance deposit address, not a self-hosted wallet. The recipient must verify it is still active for USDC over Solana and meets Binance deposit requirements. Do not use it for native SOL transfers.
