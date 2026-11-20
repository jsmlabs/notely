# Notely v2.0.3 — P1 Responsive & UX Implementation

## Source baseline

Based on `NOTELY_COMPONENT_SPECIFICATION_P1.md` and `NOTELY_RESPONSIVE_UX_FLOWS_P1.md`, while preserving the existing two-region workspace and one-at-a-time popup/sidepanel view model. No new permissions, dependencies, storage schema, or speculative features.

## Shipped changes

- Prevent focus mode without an active note; enter editor and return keyboard focus when focus mode is toggled.
- Keep sidebar size in bounds for available workspace width, reflecting effective maximum in the keyboard separator's accessibility metadata.
- Release pointer capture after sidebar resize to prevent lingering dragging.
- Maintain note-list scroll position across note edits/updates; reset scroll for explicit searches/filters.
- Protect narrow side-panel editor controls, footer actions, text region, and short-viewport dialogs against horizontal overflow and clipping.
- Preserve responsive workspace breakpoint (single view at <=700 px; dual region at >=701 px).

## Validation evidence

- `npm run check` and `npm test` run against source; see `P1-TEST-RESULTS.txt`.
- Chromium rendered **static original HTML/CSS** at popup 400×580, side-panel 280×650 / 360×720, workspace 700×650 / 701×650 / 1440×900; see `qa-screenshots/`. All six static layouts were measured without root horizontal overflow.
- Static screenshots do NOT prove extension startup, Chrome API interoperability, storage persistence, focus events, resize dragging, or real note editing. Chrome extension loading and local browser navigation were blocked by the execution environment. Interactive Chrome extension acceptance remains **open**.
- New P1 tests check source contracts, not a browser E2E simulation. No WCAG certification or automated pixel-diff regression claim is made.

## Remaining acceptance work

1. Install unpacked build in Chrome 116+; verify list ↔ editor and focus/keyboard restoration.
2. Exercise save failures/Retry, restore, deletion/Undo and import under real Chrome storage and Service Worker.
3. Test keyboard and screen reader at 200% zoom and multiple system font scales.
4. Record installed-extension screenshots and compare to reference wireframes.

## v2.0.4 follow-up — keyboard focus stability

- Added `note-list-focus.mjs` to capture focus by stable note ID before list redraw and restore to the same or nearest surviving note.
- Added `aria-current` to the selected note card.
- Added 4 focused unit tests, run with the full regression suite.
- Extension UI interaction, real Chrome Storage and screen reader tests remain unverified in the host runtime.
