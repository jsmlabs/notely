# Notely — P1 Component Specification

**Status:** Design and implementation contract (proposed); **source baseline:** local Notely v2.0.2 project inspected 2026-11-20. **Scope:** Chrome popup, side panel, full workspace. **Not a claim of implemented changes or visual QA.**

## 1. Product reality and constraints

- Manifest V3, minimum Chrome 116, permissions `storage`, `contextMenus`, `sidePanel`; commands include `quick-note` (`Ctrl+Shift+9`).
- Current popup (`popup.html`) uses a fixed `400 × 580 px` root and a **list/editor view switch**, not a simultaneous two-pane view.
- Side panel and workspace reuse shared UI DOM patterns and styling; workspace uses a two-region sidebar/editor layout with a resize separator. In the inspected CSS its narrow-screen collapse is `max-width:700px` and the adjustable sidebar range is **260–520 px**.
- Current features evidenced by code: new/quick notes, search, field/tag/favorite filtering, sorting, favorites/pin, tags, Markdown editing and preview, plain-text/Markdown exports, JSON backup/restore, user-controlled capture-source option, autosave error/retry, deletion confirmation/undo, recovery banner, theme toggle, focus mode and keyboard shortcuts.
- The **three-region workspace**, permanent archive navigation, dedicated full settings page, arbitrary rich-text editing, sync status, and new generalized tags management are **not confirmed** in this baseline. Treat such mockup details as future enhancements requiring separate scope.
- No new Chrome permissions or third-party dependencies are authorized by this specification.

## 2. Common design foundation (proposed contract)

| Token | Specification |
|---|---|
| Font | `Inter, system-ui, -apple-system, Segoe UI, sans-serif` (system fallback without network font requirement) |
| Body | 14 px / 1.5, weight 400 |
| Label / metadata | 12–13 px, weight 400–600; not below 12 px for important controls |
| Section title | 16–18 px, weight 600–700 |
| Note title | 24–28 px desktop; 20–24 px narrow editor |
| Spacing | 4, 8, 12, 16, 24, 32 px |
| Radius | 6 px compact, 9 px controls, 12 px dialogs/panels |
| Target hit area | 36×36 px minimum for compact pointer controls, 40×40 px preferred; keyboard focus always visible |
| Border | 1 px subdued; avoid nesting framed cards |
| Motion | 120–180 ms, opacity/background/border only; `prefers-reduced-motion` disables nonessential transitions |
| Themes | Dark and light with named semantic tokens; avoid hex values inside feature CSS |
| Truncation | One line for compact titles, one or two lines for previews; never truncate user text in editor |
| Overflow | Independent scrolling for note list/editor; horizontal viewport scroll prohibited |
| Localization | Use one UI language consistently; allocate room for 30% longer labels |

**Semantic token names:** `--nt-canvas`, `--nt-surface`, `--nt-surface-alt`, `--nt-field`, `--nt-text`, `--nt-text-muted`, `--nt-divider`, `--nt-accent`, `--nt-accent-text`, `--nt-focus`, `--nt-danger`, `--nt-warning`, `--nt-success`, `--nt-selected`, `--nt-hover`, `--nt-disabled`. The design-board hex codes are illustrative until contrast measurements confirm them. State is conveyed with icon/text as well as color.

## 3. Global state conventions

- **Interactive states:** `default`, `hover`, `focus-visible`, `pressed`, `selected`/`aria-pressed`, `disabled`, `busy`, `error` where applicable.
- **Async persistence:** `clean → dirty → saving → saved`; failed persistence enters `error` with retained unsaved content and explicit `Retry` path. Never display success until storage confirms success.
- **Keyboard:** Tab/Shift+Tab visits controls logically; Enter/Space activates buttons; Escape dismisses modal or clears focus/search only where advertised; native text editing shortcuts retained.
- **Accessibility:** every icon-only control has a programmatic accessible name; invalid inputs have visible and programmatic errors; dialogs trap and restore focus; live updates avoid noisy announcements.
- **Data integrity:** switching/closing a view must not silently discard pending writes; errors must never be hidden by an optimistic Saved label.

## 4. Component contracts

### C01 — BrandHeader
- **Scope:** all surfaces. **Parts:** SVG brand mark 28–32 px, `notely.` wordmark, contextual actions for side panel, full workspace and theme.
- **Size:** popup 56–64 px high; panel 56–64 px; workspace 60–68 px. Horizontal padding 12–20 px.
- **Variants:** `popup`, `sidepanel`, `workspace`, `compact`; collapse secondary actions into overflow at insufficient widths.
- **States:** default, hovered icon, focused icon, disabled API, unavailable side panel, current theme.
- **Interactions:** external/open workspace opens tab; side-panel opens only on Chrome-authorized user gesture; toggle theme applies persistent preference; failed API action produces actionable feedback.
- **A11y:** heading semantics not multiplied; action labels describe destination; hidden decorative mark `alt=""`.

### C02 — PrimaryButton / SecondaryButton / IconButton
- **Parts:** label, optional leading icon, optional shortcut, spinner.
- **Size:** primary height 40 px, min width 120 px, horizontal padding 14–16 px, radius 9 px. Secondary 36–40 px; icon-only 36×36 px (space permitting 40×40).
- **Variants:** `primary`, `secondary`, `quiet`, `destructive`, `icon`; no icon-only destructive action without label/tooltip.
- **States:** default, hover, focus-visible, active, disabled, busy; busy disables duplicate action without losing progress message.
- **Interactions:** pointer, keyboard; primary New note creates exactly one record per activation and navigates to editor. Quick note creates and focuses content immediately.
- **A11y:** actual `<button>`; use `disabled` or `aria-disabled` deliberately; visible focus ring ≥2 px.

### C03 — SearchField
- **Parts:** search icon, input, optional `Clear`, search hint (nonessential).
- **Size:** 38–40 px high; fills host width with ≥12 px side gutter.
- **Variants:** `default`, `with-clear`, `compact`.
- **States:** empty, focused, query entered, no results, disabled. Clear button only when input nonempty.
- **Interactions:** updates matching notes without changing underlying data; Enter may open highlighted result only when explicit; clear resets query, not independent filters.
- **A11y:** visible/accessible label beyond placeholder; `type="search"`, `aria-controls` where list ID is stable.

### C04 — FilterDisclosure / FilterControls
- **Parts:** collapsible Filters & sorting, field selector (all/title/body/tags), sort selector (updated/created/alphabetical), tag selector, favorites toggle and clear-filters control.
- **Size:** each input ≥36 px high; stacked on narrow popup.
- **Variants:** `collapsed`, `expanded`, `filter-active`.
- **States:** default, active filters, hover, focus, disabled where unavailable; empty result clearly distinguished from empty library.
- **Interactions:** update view only; Clear filters resets all filters/sort to defaults (not notes).
- **A11y:** native `<details>` or equivalent disclosed state, each select has associated label, toggle uses `aria-pressed`.

### C05 — NoteList / NoteListItem
- **Parts:** optional note icon, title, clipped preview, relative date, selected indicator, optional favorite/pin indicators.
- **Size:** list item min 60 px, suggested 64–72 px; 8–12 px internal padding; list viewport scrolls independently.
- **Variants:** `standard`, `compact`, `pinned`, `favorite`, `selected`.
- **States:** default, hover, focus-visible, selected, archived only if feature actually exists; empty/results/loading/error at list level.
- **Interactions:** activate note; preserve chosen note across filter/sort when still in results; no destructive action on row click. Arrow-key navigation only when implemented consistently with focus pattern.
- **A11y:** distinguish selected from hovered visually and semantically; avoid clickable containers with nested conflicting buttons; accessible label includes note title.

### C06 — EmptyState / NoResults / EditorEmpty
- **Size:** icon 32–40 px, heading 16–18 px, body 13–14 px, action 40 px; max text width 320–360 px.
- **Variants:** no notes, no matching notes, no selected note, no favorites (only with true separate favorites view), load/error.
- **States:** default, actionable or informational depending on recovery path.
- **Interactions:** no notes → New note; no results → Clear filters; editor empty → select/create note; load error → Retry.
- **A11y:** plain text describes why nothing appears; no reliance on decorative graphic.

### C07 — NoteEditor (Markdown source editor)
- **Parts:** title `<input>` max 120 characters, tags input, date/source info, format toolbar, source `<textarea>` max 100,000 characters, optional preview region, metadata/footer.
- **Size:** editor flexible height, content max-width 800–900 px; body font 14–16 px, line-height ≥1.5; preserve a useful minimum editor viewport even in popup.
- **Variants:** `source`, `preview`, `focus`, `readonly` only if implemented.
- **States:** no note, clean, dirty, saving, saved, error, recovery offered, text overflow/length cap.
- **Interactions:** input changes schedule resilient persist; selection/caret preserved during format operations; keyboard Undo/Redo remains native; editor does not silently convert to WYSIWYG; preview doesn't destroy source selection or text.
- **A11y:** explicit labels, correct focus after note activation, text and preview semantics, user content never reinterpreted as trusted executable HTML.

### C08 — FormattingToolbar
- **Actual actions in source:** bold, italic, inline code, link, H2, unordered list, ordered list, checklist, Markdown preview. Do **not** promise strikethrough, H1/H3, blockquotes or rich-text selection until implemented.
- **Size:** tool controls ideally 32–36 px hit area; when width limited wrap or overflow into menu instead of shrinking below readable sizes.
- **States:** default, hover, focus, active preview, disabled if no note, error feedback for malformed link if relevant.
- **Interactions:** formatting modifies selected text or inserts Markdown at caret; restores editor selection/focus; preview toggles source/preview.
- **A11y:** `role="toolbar"`, named actions, keyboard navigation pattern is consistent, shortcuts only shown when real.

### C09 — TagInput / TagChip
- **Size:** chip min height 26–28 px; input ≥36 px; max tag length 32 characters (source baseline).
- **Variants:** editable chip and noninteractive filter chip; optional removable chip.
- **States:** empty, editing, duplicate, invalid, focused, removable.
- **Interactions:** Enter commits valid tag, remove button deletes exactly that tag, accidental duplicate prevented, tag filtering reflects changes.
- **A11y:** remove action named `Remove tag <name>`; do not use color alone.

### C10 — NoteActions (Pin, Favorite, Delete, Focus)
- **Size:** icon buttons 36×36 px, focus toggle min 36 px high.
- **States:** off/on for pin, favorite and focus (`aria-pressed`); deletion opens confirmation; background busy/error.
- **Interactions:** pin/favorite update current note and list; focus mode hides distraction without losing edit state; Delete requires confirmation and supports temporary Undo according to current behavior.
- **A11y:** toggled names change to opposite action; destructive actions remain reversible only within confirmed Undo window.

### C11 — SaveStatus / Retry
- **Parts:** status icon and text; conditional Retry action.
- **Size:** compact row 20–24 px high, no major layout shift on state change; Retry ≥36 px hit area.
- **States:** saved, saving, unsaved/dirty, failed, recovery pending.
- **Interactions:** status updates from actual persistence completion; Retry resubmits current pending change; recovery banner Restore/Discard only after explicit choice.
- **A11y:** `role="status"` with throttled announcements; errors remain visibly persistent until fixed or dismissed deliberately.

### C12 — Dialog / ConfirmDialog
- **Current uses:** delete confirm; backup/restore dialog. **Size:** width min(400 px, viewport − 24 px); vertical max-height viewport − 24 px; internal scrolling.
- **States:** closed/open, initial confirmation, invalid import, busy import, completed, failed.
- **Interactions:** opening moves focus inside; Escape and Cancel close non-busy dialogs; confirmation persists only after explicit action; focus restores to invoking control.
- **A11y:** native `<dialog>` with heading/description and clear destructive emphasis; no focus behind modal.

### C13 — BackupRestorePanel
- **Parts:** download JSON, include-source checkbox, file picker `.json` max 25 MB, preview summary, merge/replace selector, explicit replace acknowledgment, Import.
- **States:** no file, reading, valid, invalid, confirmed replace, importing, success, failure.
- **Interactions:** Merge preserves existing notes under defined conflict policy; Replace requires affirmative acknowledgement; no mutation until validated; failed import leaves current data unchanged where feasible.
- **A11y:** file/error feedback linked to controls; confirmation copy describes data loss.

### C14 — Toast / UndoNotice / RecoveryBanner
- **Size:** adaptable 1–2 text lines; action hit 36 px; no edge clipping.
- **Variants:** info, success, warning, error, undo, recovery.
- **States:** entering, active, paused/focused, dismissed; persistent for errors/recovery.
- **Interactions:** noncritical notices may expire; Undo remains usable for documented period; recovery must be deliberately resolved; avoid stacked toasts covering editing.
- **A11y:** nonblocking live regions; do not move keyboard focus to standard toasts.

### C15 — ThemeToggle
- **Variants:** icon toggle (current code), future 3-way light/dark/system only if preference logic implemented.
- **States:** light, dark, focused, disabled persistence.
- **Interactions:** updates all surfaces consistently and persists preference.
- **A11y:** accessible action reflects current state (`Switch to light theme`, etc.).

### C16 — SidebarResizeSeparator (workspace only)
- **Size:** visible 1–4 px divider, easier pointer grab region ≥8 px; width domain 260–520 px **as current source**.
- **States:** idle, hover, dragging, focused; absent in popup and narrow-layout single-pane.
- **Interactions:** drag updates width within bounds; keyboard Left/Right increments 10–20 px; Escape behavior defined for drag; persistence if existing feature supports it.
- **A11y:** `role="separator"`, `aria-orientation="vertical"`, value min/max/now and focusability.

### C17 — Workspace Navigation (future visual variant; not baseline feature)
- The v1.2 **three-region** mockup depicts Notes / Favorites / Archive plus dedicated settings in a permanent left rail. The inspected source instead primarily uses filter controls within a sidebar; archive is not a confirmed feature.
- **Decision:** do not turn this conceptual navigation into release scope by accident. Either retain the existing two-region workspace or approve a separate migration/feature story with data and test changes.

## 5. Per-surface assembly

| Component | Popup 400×580 (current) | Chrome side panel | Workspace |
|---|---|---|---|
| Header + open actions | Yes | Yes | Yes |
| New / Quick note | Yes | Yes | Yes |
| Search + filters | List view | List view | Sidebar |
| Note list | List view | Sidebar or responsive list view | Sidebar |
| Editor + Markdown toolbar | Editor view | Editor region / narrow editor view | Main region |
| Save / retry | Footer in both views | Editor and list | Editor and list |
| Backup/restore dialog | Yes | Yes | Yes |
| Adjustable sidebar width | No | Only if usable width supports it | Yes, range 260–520 |
| 3-region navigation | No | No | Not baseline; separate feature |

**Responsive behavior:** Do not hardcode a constant side-panel width; Chrome controls its width. Prefer container-driven rules. Below a useful two-pane minimum, switch to list/editor rather than squeeze an editor beneath unusable controls. Keep popup's 400×580 baseline stable unless design scope expressly changes it.

## 6. Interaction acceptance matrix

| Flow | Preconditions | Expected behavior | Failure case |
|---|---|---|---|
| Create note | Library available | One new note, selected editor, focused field | Storage failure exposed, no false Saved |
| Search | Notes exist | Results narrowed, other notes unchanged | No results gives Reset/Clear action |
| Apply filter | Some notes | Filter state visible and count updated | Reset restores defaults |
| Select note | Row exists | Correct content/editor, selection indicated | Pending edits preserved or error surfaced |
| Format selection | Source editor active | Correct Markdown insertion, caret preserved | Selection remains usable if operation unsupported |
| Preview | Editor active | Safe rendered Markdown, reversible toggle | Invalid syntax cannot execute scripts |
| Change tags | Valid tag | Added/removed, persisted, filter reflected | Duplicate/invalid handled without corrupting note |
| Delete | Note selected | Confirmation → delete → temporary Undo | Cancel doesn't alter data |
| Persist edit | User types | dirty→saving→saved on actual success | error + retry, draft remains available |
| Import backup | Valid JSON | User sees preview and merge/replace choice | Invalid/oversized file rejected safely |
| Switch theme | Any surface | Current theme consistently updated | Persist failure handled without inconsistent views |
| Resize sidebar | Wide workspace | Bound to 260–520 px, keyboard reachable | Layout remains usable at both ends |

## 7. Test and visual-acceptance contract

1. **Static/code:** each UI binding is present and unique; all actions have label/role; no undeclared features; no added permission; no duplicate handler invocations.
2. **Automated supported:** `npm run check` and `npm test`; feature-level tests for filtering, note persistence and error handling; use DOM/browser tests only if runtime provides suitable environment.
3. **Real rendering (must not be claimed without Chrome/browser execution):** actual popup at 400×580; side panel at ~320/360/480 px; workspace at ~700/701/1024/1440 px. Test both themes, zoom 100% and 200%, long titles, empty data, 100+ notes, maximum-length content, hidden/visible dialogs and failed save.
4. **Accessibility:** keyboard-only complete flows, visible focus, correct modal focus, readable labels, contrast tests against computed colors, reduced motion, screen reader spot check when available.
5. **Regression:** note CRUD and export/import payloads unchanged; preview/export not corrupted; no horizontal overflow; note selection and scroll positions predictable; no data loss on surface switches.

## 8. Component-level Definition of Done

A component is P1-complete only if: (a) variants are documented; (b) all applicable states are rendered; (c) pointer and keyboard semantics operate correctly; (d) tokens are centralized; (e) empty/error/busy paths are covered; (f) it behaves correctly at all applicable surfaces; (g) automated tests actually run and pass; and (h) real visual review has been performed when a Chrome/browser runtime is accessible. Unverified items remain explicitly **not verified**.

## 9. Scope boundary / change control

The low-fidelity mockups and illustration boards are visual references, not evidence of shipped components. Any change to storage schema, archive feature, dedicated preferences, WYSIWYG editing, background sync, or permanent triple-column workspace requires explicit feature acceptance and independent tests. This specification does not implement or approve such changes.
