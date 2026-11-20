# Notely — P1 Responsive & UX Flows

**Status:** Proposed, source-grounded implementation/acceptance contract — **not implemented**.  
**Baseline:** Notely v2.0.2 (`popup.js`, `styles.css`, `popup.html`, `sidepanel.html`, `navigation.mjs`, `storage-queue.mjs`) inspected 2026-11-20.  
**Dependencies:** `NOTELY_COMPONENT_SPECIFICATION_P1.md` (C01–C17).  
**Surfaces:** Chrome browser-action popup, native Chrome side panel, full-tab workspace.  
**Constraints:** MV3; no new permissions or dependencies, schema changes, sync, archive, WYSIWYG, or permanent three-column navigation in this phase. Image mockups are references, not shipped functionality.

## 1. Scope and governing UX principles

1. One canonical notes/editor data model and shared component semantics across surfaces. Do not fork CRUD, format, autosave, or backup logic for each viewport.
2. Preserve note content, selection, filters, and scroll context when views change; never promise cross-window state preservation beyond what is actually persisted.
3. The popup and side panel expose **one primary view at a time** (`list` or `editor`). The workspace exposes **two regions on wide screens**, switches to single-view on narrow screens, and supports focus-writing mode.
4. A visual Saved indicator is permitted only after authoritative persistence succeeds. Error state and Retry must remain available in the active surface.
5. Avoid horizontal page scroll. Individual long-form text fields and list containers may scroll internally without clipping content/actions.
6. Every navigational and modal transition must have defined focus entry/return and a clear keyboard route.

## 2. Source baseline versus proposed improvements

| Area | Verified in source | P1 contract / proposed improvement |
|---|---|---|
| Popup | CSS declares 400×580 px baseline; later width rule `min(400px, 100vw)` with a 300 px min-width; `list/editor` data-view switch | Preserve 400×580 nominal size, test narrowing/clipping, limit footer/action congestion |
| Side panel | `body.sidepanel`, 100% variable width, `list/editor` one-view CSS | Container/viewport-safe layout at 280, 320, 360, 480 px; don't force desktop two-column |
| Workspace | Full-tab `?workspace=1`, two-region sidebar/editor, ≤700 px collapse | Keep threshold at 700 px initially; verify 700/701 boundary and feasibility of fixed 260 px sidebar |
| Sidebar | Width 260–520 px, `--sidebar-width`, keyboard arrow steps of 20 px, width clamp to available editor space | State-dependent effective limits, accessible separator, persisted width only if separately approved |
| Focus | Workspace focus mode hides sidebar and resize divider | Restore previous visible/selected region and keyboard focus on exit; no state loss |
| Editing | Textarea Markdown source, preview, formatting actions, draft journal and storage queue | Define explicit caret/focus/preview transitions and save-failure handling |
| Navigation | `switchView`, `openNote`, `returnToList`; note list focus logic | Explicit transition matrix and deterministic focus return |
| Recovery | Recovery banner with Restore/Discard, separate recovered copy | Distinct unresolved/failed/success states; accessible status and safe retry |
| Dialogs | Delete confirm and backup/import dialogs | Focus containment, close semantics and narrow-screen scroll |

**Caution:** The above verified claims come from code inspection, not a Chrome runtime or screenshot verification. UX contracts below may require code changes.

## 3. Layout architecture / regions

### 3.1 Viewport and sizing rule

Use the **actual rendering container size**; no JavaScript UA/device sniffing. Prefer CSS container queries for internal components only if safely supported by Chrome minimum 116; the existing application uses `@media` and can retain it for P1. Heights use available viewport (`100dvh`) and `min-height: 0` on flex/grid children. At zoom and small heights, prioritise independent scrolling over shrinking text or action targets. Never interpret the static 3:4/4:3 wireframe aspect ratios as actual application sizes.

| Surface | Reference viewport | Layout | Header / actions | Scrolling | When narrow |
|---|---|---|---|---|---|
| Popup | Nominal **400×580 px** | `list` XOR `editor` | Compact 56–64 px; New and Quick Note may share action row | Note list OR editor body scrolls; header/footer remain reachable | 300–399 px is resilience target, not a new Chrome popup size guarantee; collapse secondary labels/filters before reducing hit targets |
| Side panel | Chrome-managed width; test 280/320/360/480 px | `list` XOR `editor` at **all widths** in P1 | Compact header; context actions can overflow | Notes list scrolls independently; editing region scrolls within page | At ≤340 px reduce gutters, move secondary tools into overflow, preserve title and body at readable size |
| Workspace (wide) | >700 px; test 701, 768, 1024, 1440 px | Sidebar + editor, resize separator | Shared brand + editor toolbar | Each column scrolls independently | Maintain editor min useful width **320 px**; clamp sidebar effective width; if feasibility fails at boundary, single-view fallback is permitted only as an explicitly tested patch |
| Workspace (narrow) | ≤700 px; test 320, 375, 700 px | `list` XOR `editor` | Visible Back from editor | List/editor independently scroll | No divider / drag affordance; no false two-column layout |
| Workspace focus | Wide or narrow workspace | Editor prioritised; sidebar hidden while active | Exit Focus visible and keyboard reachable | Editing only | Exiting restores view without discarding note or cursor |

### 3.2 Proposed size contracts

- App wrapper: `min-width:0; max-width:100%`; prevent nested content from expanding grid/flex tracks.
- Sidebar wide workspace: requested width 260–520 px; effective max = `min(520, viewportWidth - 320 - dividerWidth)`. If effective max <260, fall back to narrow mode rather than violating editor minimum. A 701 px wide workspace can accommodate 260 + 5 + 320 = 585 px before other spacing; test actual content, not arithmetic alone.
- Resizer: divider visual 5 px in current CSS; easier pointer target ≥8 px desired without altering grid footprint, keyboard arrow step 20 px (verified baseline). Home/End as optional additions; if implemented, update accessible help.
- Popup/side panel: horizontal gutters 12–16 px; editor body ≥14 px; untruncated content. Filter and formatting actions may wrap; avoid introducing nested horizontally scrolling toolbars without keyboard discoverability.
- At viewport height 320–450 px: preserve a clear path to Back, New Note, editor, Save Error/Retry and modal action buttons using flexible/scrollable regions. No absolute bottom positioning that overlays active input.
- Zoom 100%, 125%, 200%: maintain all major actions; test **actual browser-rendered pixels**, not merely CSS widths.

### 3.3 Breakpoint specification

| Condition | Required behavior | Source status |
|---|---|---|
| `workspace width <=700px` | Show only selected list/editor view; Back in editor; no sidebar resize | Existing CSS, requires runtime verification |
| `workspace width >=701px` | Both columns remain visible outside focus mode, even if `data-view` changes | Existing CSS override, requires verification |
| `sidepanel any width` | Single view; show Back inside editor | Existing CSS, proposed boundary tests |
| `popup 400px nominal` | Single view; stable compact layout | Existing CSS, proposed boundary tests |
| `width <=340px` | Compact gutters / toolbar; no clipped primary action | Partially existing CSS, requires accessibility review |
| `prefers-reduced-motion:reduce` | Nonessential transitions disabled | Existing CSS, requires verification |

Do not add a permanent navigation rail, archive screen, or untested responsive breakpoint to satisfy mockup composition.

## 4. Formal navigation state machine

### 4.1 State model

```ts
type Surface = 'popup' | 'sidepanel' | 'workspace';
type Region = 'list' | 'editor';
type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
type Overlay = null | 'delete-confirm' | 'backup-import' | 'recovery';
interface ViewState {
  surface: Surface;
  layout: 'single' | 'dual' | 'focus';
  region: Region;
  activeNoteId: string | null;
  lastFocusedNoteId: string | null;
  overlay: Overlay;
  preview: boolean;
  save: SaveState;
}
```

This is a **specification model**, not an existing type declaration or proposed storage schema.

### 4.2 Transition table

| Event | Precondition | State change | Focus target | Rejection / edge case |
|---|---|---|---|---|
| Application loaded | Storage fetch success | `region=list`; dual workspace displays empty editor if none selected | Search or first meaningful list control; don't steal existing browser focus on incidental refresh | Fetch error: disable mutations, expose load failure |
| New Note | Under 1,000-note limit | Create one note; `activeNoteId=new`; `region=editor`; preview off | Title input (quick note: body) | Max reached: notice, keep view and data |
| Select Note | Existing note ID | Set active note; editor visible; preview off | Editor title on explicit activation | Deleted/missing ID: leave list and explain if necessary |
| Back | Single-view editor | `region=list`; preserve active note | Previously selected note row if still displayed, else search | Do not suppress dirty/error state |
| Search shortcut | No modal open | `region=list`, search focus and select | Search field | If focus mode enabled, exit or define consistent list-reveal action |
| Filter / Sort | List visible | Adjust visible results, not note data | Control used; avoid stealing focus on rerender | If active note filtered out, retain editor note until explicit selection change |
| Toggle Preview | Active editor | Source ↔ rendered preview | Preview toggle, then editor when toggled back if previously editing | Markdown never executes script; current caret survives |
| Enter Focus | Workspace + active note | `layout=focus`; hide sidebar | Editor body or an explicit Exit Focus button | If no active note, disable or keep empty editor safely |
| Exit Focus | Workspace focus | Restore `dual`/`single` by width | Previous editor field where practical | No edits discarded; active note unchanged |
| Resize viewport across 700/701 | Workspace, no modal dependency | `single` ↔ `dual`, keep active note and region | Keep logical focus if still visible; otherwise move to corresponding visible target | Prevent focus trapped in hidden sidebar |
| Delete | Confirmed active note | Remove note, `region=list`; show Undo notice | New Note or previous note row | Cancel = no mutation; error remains recoverable |
| Restore Undo | Undo snapshot still valid | Reinstate note without duplicate IDs | Restored note or nonintrusive notice | Expired undo = no action, clear notice |
| Save fail | Write rejected | `save=error`; retain in-memory text/recovery draft | Do not steal editor focus | Retry visible; never say Saved |
| Retry | `save=error` | New write attempt; `saving→saved/error` | Retry or previously active editor field | Prevent overlapping attempts |
| Open Dialog | Explicit action | `overlay=...` | Dialog first safe control / title | Background inert; ESC policy consistent |
| Close Dialog | Cancel/ESC when safe | `overlay=null` | Invoking control if still present | Busy destructive import cannot be dismissed silently |

### 4.3 Notes and view persistence

- Store user notes only through the existing coordinator/storage queue, not through a new per-surface source of truth.
- Preserve search query/filter/sort within the active view session when returning from editor; do not promise persistence across reopening unless explicitly implemented.
- Preserve visible scroll location when returning to list when practical. Existing `renderList()` replaces all nodes; a future patch may need to capture/restore list scroll or selected item position.
- On resize while caret is active: retain text selection if the DOM node persists; if navigation hides it, move focus to a visible control without auto-triggering an edit.
- `Escape` in source editor returns to list in existing code. This **may conflict with assistive or composition workflows**; protect IME composition and modal priority. Do not intercept Escape from a select dropdown or native system UI incorrectly.

## 5. End-to-end UX flows

### F01 — First launch / empty library

1. Load theme and notes. On success show empty list and **New note**; avoid misleading "Saved" on an unresolved load.
2. New Note creates exactly one item, opens editor, focuses title. Quick Note focuses body when specifically invoked.
3. Autosave sequence: dirty -> saving -> saved only after persistence confirmation. If saving fails: persistent error, recovery draft and Retry.
4. Close/reopen without success: offer recovery candidate if a journal exists; Restore creates separate copy only after confirmation and successful save.

**Acceptance:** keyboard-only creation works, 0-note state correct, no duplicate note creation, no lost edits on failed save.

### F02 — Find and edit an existing note

1. Enter query. Change field/tag/favorites/sort independently; note count and no-match state reflect filters.
2. Open a matching note, edit title/body, optional formatting, preview. Input must remain usable if filter excludes the edited note.
3. Return to list; preserve query and useful selection/focus context. Clear Filters resets view criteria, never content.

**Acceptance:** no scroll jumps while typing in editor; user sees a clear No results state versus empty library.

### F03 — Popup and Side Panel editor navigation

`LIST → [select/new] → EDITOR → [back/Escape] → LIST`. No simultaneous squeezed list/editor. Side panel resizing does not unexpectedly reset editor or note selection. Popup may be closed by Chrome at any time: autosave/recovery must cover interrupted writes as far as supported by the existing system. Never claim synchronous save-on-close is guaranteed.

### F04 — Workspace dual to narrow and back

At ≥701 px, present sidebar + editor concurrently. When narrowed to ≤700 px, show the **previously active logical region**, prioritizing editor while editing. On Back show list. When width grows, reveal both columns without resetting note, filters, draft, or edit focus. If editor is empty, show its true empty state.

### F05 — Markdown editing and preview

- The source editor is a `<textarea>`: preserve selection/caret around supported formatting inserts. Do not represent the image's full rich-text toolbar as present unless code supports those commands.
- Shortcuts only fire in intended contexts; Ctrl/Cmd+S triggers retry/save path, not browser Save As. Ctrl/Cmd+K search/navigation must not break link formatting inside editor (source code prioritizes body editor formatting).
- Preview is a safe rendered view; toggling back restores source text, and state resets consistently upon switching notes.
- Long titles (up to 120 chars), large body (up to 100,000 chars), code blocks, very long unbroken words, Unicode/emoji and mixed-direction text must not cause horizontal app overflow.
- IME input and spellcheck must not trigger premature navigation or formatting.

### F06 — Destructive actions / backup / restoration

- Delete requires confirmation; Cancel is no-op; success exposes temporary Undo with actual expiry behavior. If storage fails, do not misrepresent persisted deletion.
- JSON import: file size ≤25 MB; validate before merge/replace; replacement requires explicit acknowledgement and visible consequences. Preserve existing dataset on invalid import and recover failures where feasible.
- Recovery banner: Restore/Discard are deliberate; failed Restore retains source journal; retry uses the same recovery identifier to avoid duplicate copies.

### F07 — Preferences and accessibility

- Theme toggle applies to current surface and saves with failure rollback as source code indicates. Do not invent a settings page or system-mode toggle.
- Settings-related UI is the existing available controls (e.g., backup/import, capture-source option), not the concept board's unimplemented preference categories.
- Keyboard order should follow visual order; modal traps focus and returns it on closing; icon actions have readable labels. Do not require hover for access to destructive actions.

## 6. Edge-case matrix (P1)

| ID | Test condition | Expected result |
|---|---|---|
| E01 | Popup nominal 400×580 and narrower effective width | No clipped New Note, Back, footer or Retry; no horizontal app scroll |
| E02 | Side panel 280/320/340/360/480 px | Search, selected note, editor title and action reachability maintained |
| E03 | Workspace 700→701→700 px repeatedly | Correct single/dual state, same active note, no destructive reinitialization |
| E04 | Workspace width smaller than requested sidebar+editor | Effective sidebar clamps; editor remains usable, separator value reflects actual width |
| E05 | Zoom 200%; 320–450 px height | Vertical scroll is reachable; modal actions not obscured |
| E06 | 120-char title, 100k-char body, unbroken URL | No horizontal overflow or content corruption; cursor retained |
| E07 | 0, 1, 100, 1,000 notes | Empty/single/long/limit states consistent; creation capped correctly |
| E08 | Filters match zero results | No-results message with clear/reset path; notes unaffected |
| E09 | Active note deleted in another open window | View safely returns to list/empty; no stale write resurrects deleted note unexpectedly |
| E10 | Two windows editing same note | Existing coordinator conflict behavior evaluated; no false promise of real-time collaborative conflict resolution |
| E11 | Save API/service worker failure | Error + Retry + recovery path; content remains visible; no false Saved |
| E12 | Popup closes mid-save | On reopen notes persisted or recoverable draft offered where journal completed; document unavoidable browser shutdown limits |
| E13 | Import bad JSON, oversized or replacement | Validation before mutation; explicit overwrite confirmation; errors clear |
| E14 | Back, Esc, Ctrl/Cmd+K, Ctrl/Cmd+N, formatting shortcuts | No conflicts when typing, composing with IME, or using modal |
| E15 | Keyboard-only and screen reader | Visible focus, correct names/roles/status, no focus behind modal |
| E16 | Dark/light with high zoom and reduced motion | Readable contrast, no dependence on color alone, motion settings honored |
| E17 | Toast, recovery banner, OSK/mobile browser | Critical actions remain operable; overlay doesn't block editing unexpectedly |
| E18 | Tag overflow (12 tags), duplicate tags | Safe validation, readable chips, no inaccessible remove controls |
| E19 | Long translations and date strings | No truncated essential controls; layout adapts |
| E20 | No note selected + focus mode or preview action | No crash, coherent empty editor; disabled actions honest |

## 7. Accessibility contract

- **Labels:** all icon buttons have `aria-label`/visible tooltip descriptions; placeholders are not sole field labels.
- **Focus:** visible ≥2 px outline, adequate offset, deterministic restoration to invoking row after editor/modal closure, no hidden focused nodes after breakpoint changes.
- **Dialogs:** accessible name/description, focus trapped and restored, destructive confirmation explicit, no accidental Enter-submission of Replace without acknowledgement.
- **Dynamic messages:** Save errors and restoration announcements discoverable but throttled; do not repeatedly announce every keystroke or auto-save tick.
- **Color:** computed text, placeholder, focus and selected colors need measured WCAG AA contrast; proposed palette boards do not establish compliance.
- **Keyboard:** navigation, note selection, editor formatting, preview, Resize and confirmation flows must be executable without pointer. Keyboard behavior matches native semantics.
- **Reduced motion:** disable nonessential transitions; never animate content position while keyboard is editing.

## 8. Implementation sequence (bounded P1)

1. **Tests first — state model:** pure unit tests for viewport classification, view transitions, editor/focus invariants and save status sequencing; no permissions or new dependencies.
2. **CSS sizing:** define safe min widths/gutters and scroll containers; remove contradictory rules only after checking specificity/precedence against existing CSS.
3. **Navigation and focus:** add deterministic focus restoration and resize handling without duplicating popup/side-panel logic; preserve typing selection.
4. **Editor and recovery resilience:** wire state transitions to existing journal/queue, block optimistic Saved labels, respect IME and modal priority.
5. **Dialog/notification QA:** focus, narrow heights, invalid imports and Retry.
6. **Regression test:** run `npm run check` and `npm test`, plus browser/DOM tests if available and supported.
7. **Visual acceptance:** obtain **actual** browser screenshots at popup 400×580; panel 280/320/360/480; workspace 320/700/701/1024/1440 in both themes, plus 200% zoom and keyboard focus. Compare against wireframes for structure, not speculative features. If browser is unavailable, mark visual checks **not executed**.

## 9. Traceability / acceptance test IDs

| Acceptance ID | Covers | Pass criterion |
|---|---|---|
| RUX-01 | Popup layout | Single view, controls reachable, no horizontal overflow |
| RUX-02 | Side panel | Variable width, same active note and stable editor |
| RUX-03 | Workspace responsive | 700/701 breakpoint correct; dual/single transitions preserve state |
| RUX-04 | Sidebar resize | 260–520 limits plus available-width clamp, keyboard + pointer |
| RUX-05 | Navigation | Back/selection/search shortcuts and focus restoration deterministic |
| RUX-06 | Editor | Markdown source/preview, caret preservation, input limits respected |
| RUX-07 | Persistence | Authoritative saving states, retry, draft recovery |
| RUX-08 | Destructive/backup | Confirmation, undo, validation, safe failure |
| RUX-09 | A11y | Keyboard/focus/status/modal semantics and contrast check |
| RUX-10 | Visual | Real screenshots on declared matrix; no fabricated results |

## 10. Definition of Done and evidence ledger

**P1 specification is complete when:** all surfaces have explicit layout modes, every user navigation transition has a precondition/outcome/focus target, editor/persistence failures have specified recovery, edge cases have reproducible expected results, and tests are traceable via RUX IDs. **Implementation is complete only when code is changed and actual tests pass. Visual QA is complete only after running/rendering the stated browser cases.**

**Current evidence (2026-11-20):** Inspected `NOTELY_COMPONENT_SPECIFICATION_P1.md`, `styles.css`, `popup.js`, `sidepanel.mjs`, `navigation.mjs` and `package.json`. This deliverable changes **documentation only**. No source changes, automated test execution, browser run or visual acceptance claimed.
