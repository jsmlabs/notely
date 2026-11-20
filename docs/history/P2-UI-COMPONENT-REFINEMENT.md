# Notely 2.0.6 — P2 UI Component Refinement

## Scope
Shared CSS for Chrome popup, side panel, and workspace; no markup/JS/storage/permissions changes.

## Changes
- Removed two obsolete theme palettes overridden by `design-tokens.css` and the existing token aliases.
- Removed duplicate hardcoded root font definitions in favor of `--font-ui`.
- Replaced repeated hardcoded radii, focus borders, and transition durations in the active shared component layer with tokens.
- Consistent focus-visible, disabled, hover, selected-note and editor formatting button states using shared CSS.
- Extended reduced-motion rules to covered interactive components.
- Added focused regression checks for the theme cascade and shared component states.

## Scope boundaries
- No change to Chrome permissions, persisted note data, JavaScript state transitions or markup.
- Installed Chrome extension, service-worker/storage E2E, screenreader, and browser visual approval are not verified; previously skipped at user's instruction.
- Visual equivalence needs runtime assessment because CSS cascade can yield subtle differences.

## Testing
Results are reported in the conversation accompanying the generated archive.
