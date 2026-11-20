# Notely v2.0.20 — Support reopen regression repair

## Reproduced fault

On Chromium with motion enabled: open Support, press Escape, await the 110ms closing animation, then open Support again. The Web Animations closing effect retained `fill: 'forwards'`, overriding the new opening animation and keeping the dialog at computed `opacity: 0` despite `open === true`. With `prefers-reduced-motion: reduce` it did not occur.

## Fix

Cancel the finished closing animation before calling native `dialog.close()`. This removes the retained compositor style without removing the existing opening/closing transition. No storage schema, donation address, network access, permissions or dependencies changed.

## Verification

Run `npm run check`, `npm test`, `python qa-support-reopen.py` from the project root. `qa-support-reopen.py` runs the actual support handlers and styles in headless Chromium with the browser's native dialog, Web Animations and reduced motion. It does not exercise a fully installed Chrome extension.
