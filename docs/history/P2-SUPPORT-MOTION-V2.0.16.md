# Notely v2.0.16 — Support Dialog Motion

## Changes
- Event-driven, opacity-only 160 ms opening animation on the dialog and backdrop.
- Opacity-only 110 ms close animation for close button, Done and Escape.
- Reduced-motion immediately disables animations and uses native close.
- A single in-flight closing animation prevents double close and preserves focus restoration.
- No timers, external libraries, continuous animations, layout movement or new permissions.
- Existing USDC QR code, receiving address and copy behavior unchanged.

## Acceptance
Run `npm test`, `npm run check`, and the Chromium motion checks. Chromium checks must observe open, close, reduced motion, and the compact 400 × 580 px geometry. Static rendering does not validate Chrome extension storage or hosted wallet deposits.

## Executed checks
- `npm test`: 114/114 pass.
- `npm run check`: pass.
- Chromium 400×580, normal motion: opening/backdrop animation present, dialog within viewport, Escape closes and restores trigger focus.
- Chromium 400×580, reduced motion: animations disabled, Escape closes and restores focus.
- No real Chrome extension installation or memory profiling performed.
