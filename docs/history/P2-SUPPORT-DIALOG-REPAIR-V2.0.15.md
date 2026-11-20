# Notely v2.0.15 — Support Dialog UI Repair

## Screenshot-reported defect
The previous donation modal was too tall and visually inconsistent: nested card border, duplicated address, oversized QR and text, and clipped content at shorter viewport heights.

## Change
- Retained native modal, event handlers, clipboard fallback and unchanged receiver address/QR data.
- Removed the repeated receiving-address rendering; a selectable, read-only textarea now shows the full address.
- Reduced QR to 126px, or 116px for short windows.
- Replaced nested card design with simple dividers, consistent Notely theme tokens and compact form controls.
- Limited dialog height to viewport with contained vertical scroll, even at narrow widths.
- Kept USDC/Solana/Binance warnings and voluntary language.
- No new permissions, dependencies, or network requests.

## Validation
Verified with `npm test`, `npm run check`, and `qa-support-dialog.py` at 280 × 580, 280 × 450, 400 × 580, and 1440 × 900. The normal 400 × 580 popup fits without internal scrolling; narrow/short side panels scroll internally. No horizontal viewport overflow. Static Chromium rendering only; no installed-extension runtime test.

## Limits
Static HTML/CSS browser checks do not validate an installed Chrome extension or actual blockchain transfers.
