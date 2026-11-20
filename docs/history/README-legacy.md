# Notely — Clean Notes v2.1.3

**Local interaction-state consistency candidate (not published).** Recovery now blocks discard and backup import until its save is acknowledged, including on failure. See `INTERACTION-STATE-V2.1.3.md` for changes, tests and limitations.

## Previous candidate — v2.1.2

**Local runtime-interaction regression candidate (not published).** Backup closes now invalidate outstanding asynchronous file reads and clear stale import/replace selections; Support exit animation completion now fails safely. See `RUNTIME-RELIABILITY-V2.1.2.md` for implemented changes, real checks and unresolved native-runtime gates.

## Previous candidate — v2.1.1

**Release validation candidate (local, not published).** Hardened release-resource audit and added negative tests without changing extension runtime or storage. See `RELEASE-VALIDATION-V2.1.1.md`.

## v2.0.22 — List preview performance

- Bound displayed list previews to 180 characters. Normalization only touches a small excerpt instead of the full note body; the actual note content and persisted data are untouched.
- Performance fixture: 1,000 notes with approximately 20,000 characters each; 20 warmed Node.js iterations on the same host. Median list-preview generation: 11.49 ms (v2.0.21) to 0.306 ms (v2.0.22). This is a microbenchmark, **not** an installed-browser memory, DOM render, CPU, or user-perceived latency result.
- Three new preview regression cases and removal of a stale hardcoded version expectation. `npm run check` and `npm test` run locally. The native Chrome MV3 runtime remains unverified.

# Notely — Clean Notes v2.1.0

Local-first Chrome notes extension; this is a tested **source/archive candidate**, not a published Chrome Web Store release.

## v2.1.0 — Release Candidate Preparation

- Audited version/manifest permissions, locally referenced resources, store artwork dimensions and store-listing text.
- Added a submission checklist, permission explanations, privacy disclosure draft and a deterministic release audit (`npm run audit:release`).
- **Not published:** authentic installed-extension screenshots, final public support/privacy URLs, developer-account privacy declarations and native installed Chrome testing remain outstanding. Existing notes and data format remain unchanged.

## v2.0.23 — Codebase Consolidation & Maintainability

- Removed superseded workspace CSS declarations and unified duplicate word-count UI logic, preserving existing note behavior, storage, donations and permissions.
- Re-verified with `npm run check`, `npm test` (137/137), and 36 before/after static Chromium computed-style comparisons.
- **Native installed Chrome extension and real multi-window integration remain unverified.** See `P1-CODEBASE-CONSOLIDATION-V2.0.23.md`.

## v2.0.21 — Stability & Bugfix

- Prevent external capture/storage events for **other notes** from needlessly replacing the active editor's text and resetting its caret/selection. Active notes with genuine remote changes are still refreshed.
- Reject malformed, duplicated, or oversized external storage updates before adopting them into the visible UI; retain the current state and show a reload/error notice. All authoritative writes remain validated in the background coordinator.
- Share the same persisted-notebook validation between the service-worker coordinator and popup initialization/storage listener.
- Close the Support dialog normally if an exposed Web Animations API fails during exit, rather than trapping the user in a modal.
- Keep native backup format, storage keys, Chrome permissions, dependency set, animations and donation recipient unchanged.
- Verification: `npm run check`, `npm test` (134/134), static Chromium layout QA (6/6), repeated Support open/close in Chromium (normal and Reduced Motion), and a targeted browser fallback with a throwing Web Animations API. **Full installed Chrome runtime, actual multi-window/storage interaction, and complete accessibility acceptance remain unverified.**

## v2.0.20 — Support reopen fix

- Fix Support becoming invisible on its second opening because the finished close animation kept `opacity: 0`.
- Restore the closing animation after cancelling its retained style, while respecting Reduced Motion.
- Verify repeated opening and closing in Chromium; this is not a native installed-extension integration test.

## v2.0.18 — Reliability & Data Safety

- **Fail-closed storage:** A non-array stored notes value, duplicate or invalid IDs, or data that would be truncated by field limits blocks editing instead of silently replacing/dropping user records. A genuinely missing key still initializes an empty notebook.
- **Import edit lock:** Local note mutation buttons and editor inputs are disabled while the asynchronous backup import is applying. Guards protect shortcut and callback paths. Existing controls are restored on both success and error.
- **Recovery collision protection:** An existing note with a reused recovery ID must match the draft payload; unrelated notes are never interpreted as successfully recovered copies.
- **Compatibility:** Manifest V3, local storage keys and backup format unchanged; no new permissions or runtime dependencies.
- **Verification:** `npm run check`; `npm test` (125/125); static `python qa-v218-layout.py` (6/6 Chromium viewports). Native installed-Chrome, real storage lifecycle and accessibility checks have **not** been executed.

---

## v2.0.14 — Donation UX hardening

- Show the complete USDC Solana deposit address without truncation in narrow side panels.
- Ignore clipboard completions after the donation dialog closes/reopens; reset the Copy action on each session.
- Preserve local-only donations: no added permissions, network requests, or runtime dependencies.
- **Important:** The address is a custodial Binance deposit address. Confirm current deposit support and network/token before transferring; this extension cannot verify that status.

> Current version: **2.1.2**. Lightweight motion layer: `motion.css`. See `P2-MOTION-IMPLEMENTATION.md`.

## v2.0.10 — Production design foundation

- Added `design-tokens.css` as a single source for both theme palettes and shared spacing, radius, control, focus and motion values.
- Existing visual CSS role names now map to semantic theme tokens; popup, side panel and workspace load the same token file ahead of `styles.css`.
- Added `brand/DESIGN-SYSTEM.md` and deterministic token regression tests.
- No permissions, note-storage schema changes, runtime dependencies or feature removals. Actual installed-Chrome and accessibility acceptance is intentionally deferred.

# Notely - Clean Notes v2.0.4

Minimal, local-first Google Chrome toolbar popup, full-tab workspace and native side panel for multiple notes. Vanilla JavaScript, HTML and CSS, no build dependencies, analytics, accounts or remote APIs.

## v2.0.4 — P1 Keyboard Navigation Hardening

- Preserve the focused note across list re-renders, sorting, remote updates, and note edits using stable note IDs.
- If a focused note is removed, focus the nearest surviving note without scrolling the list unexpectedly.
- Expose the active note to assistive technology with `aria-current="true"`.
- Add four executable regression tests for reordering, deletion, external focus, and empty results.
- No new permissions, dependencies, persistence schema changes, or data migrations.
- Installed-Chrome interactive acceptance remains outstanding; Node unit tests are not equivalent to native Chrome extension tests.

## v2.0.3 — Brand identity

- Introduced a distinctive, scalable Notely brand mark and a unified wordmark system.
- Updated Chrome extension icons (16, 32, 48, 128 px), with editable SVG masters and high-resolution PNG exports.
- Replaced the generic header note icon in the popup, side panel, and full workspace.
- Added `brand/BRAND-GUIDE.md` with identity, accessibility, palette, usage rules, and asset inventory.
- No new permissions, dependencies, data migrations, or changes to notes storage.

## v1.9.2 - Full Workspace width regression fix

- The full-tab workspace now removes the popup-only 400px width cap from the document root, not just the body. The left sidebar, resize handle, and editor get their intended grid tracks at desktop widths.
- Popup (400px) and Chrome Side Panel retain their existing dimensions and behavior. No data, permission, or dependency changes.
- Layout checks cover a populated editor on desktop, tablet, compact workspace, standard popup, and side panel. Chrome installed-extension integration still requires manual verification.

## Install / upgrade

1. Unzip the current Notely release ZIP into a permanent directory.
2. Open `chrome://extensions`, enable **Developer mode**, then choose **Load unpacked**.
3. Select the extracted folder containing `manifest.json`.
4. Pin **Notely** to the toolbar and open it from the extension icon.

When upgrading an existing unpacked installation, replace its files and click **Reload** on its extension card. Reusing the **same extension ID / unpacked directory** preserves existing local notes. Loading a separate unpacked copy may create a different extension ID with separate local storage. Avoid uninstalling the old version before confirming your notes.

## v1.8.0 - Chrome Side Panel

- Click **Open Chrome side panel** (split-pane icon) in the Popup or full Workspace. It opens Notely in the current browser window beside webpages without replacing the Popup or opening a new tab. A supported Chromium browser (Chrome 116+) is required.
- The registered native side panel uses `sidepanel.html` with the existing `popup.js` controller, `styles.css`, and service-worker coordinator. It adapts to the available panel width and shows the list and editor as separate views, with a Back button in the editor. The existing full Workspace remains available from the side panel.
- Popup, Side Panel and Workspace share the same `notely.notes.v1` data in `chrome.storage.local`. All edits/imports still use `NOTES_EDIT` / `NOTES_IMPORT` messages to the single service-worker coordinator, with change notifications for idle views. Same-note concurrent edits are rejected by the existing conflict checks; use Retry after resolving a conflict. Do not close a view while it reports an unsaved edit.
- New permission: **`sidePanel`**, used only to open the native Chrome side panel. Existing permissions (`storage`, `contextMenus`), storage keys, backup format, note schema and dependencies are unchanged. No data migration is required.
- To verify in installed Chrome: open the popup, click the split-pane icon, create a note in the side panel, open the full Workspace and confirm it appears; modify it in one idle view and confirm another idle view refreshes; test the Back button, a narrow panel, and a deliberate storage failure/retry. Node tests mock Chrome APIs and do **not** prove installed-browser behavior or the user-gesture policy.

## v1.7.0 - Full Workspace

- Open **full workspace** from the arrow icon in the popup. The browser tab uses the same notes and editor, with a two-column layout on wider screens and a single-column list/editor on narrow screens.

## v1.6.0 - Quick Capture

- Select text on a normal web page, right-click, and choose **Save selection to Notely**. This uses the Manifest V3 background service worker and the `contextMenus` permission. It does not inject a content script or request host permissions. Chrome may not expose this menu on restricted browser pages.
- Captures preserve the selected text as plain text, up to 100,000 characters. Oversized/empty selections are rejected and a `!` badge indicates failure. A checkmark badge indicates a completed capture. Badge status is not a substitute for verifying the note.
- Source attribution (page URL and title) can be switched on/off in **Backup / Import**. HTTP(S) source URLs are stored as inert metadata; they are never automatically opened or interpreted as HTML. Source fields are included in JSON backups without changing the backup format version. Older v1.5.0 backups remain importable.
- **Quick note - start typing** creates a blank note and focuses the body. The optional `Ctrl+Shift+9` shortcut creates a blank note through the service worker; adjust it in `chrome://extensions/shortcuts` if it conflicts with another shortcut. Open the Popup to edit the new note.
- All writes to `notely.notes.v1` now pass through a single service-worker coordinator, including popup edits, captures, and imports. Popup changes apply as note-level differences against their acknowledged base snapshot, preserving captures and edits to unrelated notes. Concurrent edits to the **same** note are rejected rather than overwritten. Errors remain visible in the popup until Retry/reload.
- A replace import checks that the notes have not changed since preview. The popup updates on external storage changes when it has no pending edits. On a write failure, previous data is not acknowledged as committed.
- At v1.6.0, only `storage` and `contextMenus` permissions were requested. There is no cloud service, content script, telemetry, or extra runtime dependency.

### v1.6.0 verification and limitations

Node integration tests exercise the shared coordinator under concurrent edit/capture operations, stale edit conflict, replace/merge conflicts, backup compatibility, invalid URLs, size limits and rejected writes. They simulate Chrome Storage, not the actual installed Chrome extension. Native Chrome context menu availability, shortcut registration, badge updates, cross-context lifecycle and popup UI require a real-browser smoke test. Chrome may terminate a popup before a pending storage acknowledgement, so verify the saved indicator and retain external backups of valuable data.

## v1.5.0 - Backup & Data Safety

- **Backup / Import** in the notes list opens a local-only dialog. **Download JSON backup** requests a versioned `.json` file containing all notes, tags, favorites, pins, IDs, timestamps and original Markdown bodies. Confirm that the file actually appears in Chrome Downloads before relying on it.
- **Import** accepts Notely's version 1 JSON backup format (`format: "notely-backup"`, `version: 1`, `notes: [...]`); maximum 25 MB and 1,000 notes. The entire archive is validated before planning any write. Files with invalid records, duplicate IDs, unexpected field types or unsupported versions are rejected instead of silently truncating content.
- **Merge** retains all existing note IDs unchanged; records with new IDs are appended. Duplicate IDs are skipped, including conflicts where the imported content differs. The preview shows counts before committing.
- **Replace** substitutes the entire note collection, including allowing an empty backup. It requires checking an explicit confirmation after obtaining a separate JSON backup. Replace does **not** combine records.
- The import waits for local pending edits, then commits through the service-worker coordinator. A replace operation rejects when notes changed since the preview; merge adds only new IDs to the latest stored state. The popup adopts the new collection only after a successful storage acknowledgement. Maintain an external backup before replacing data.
- In the editor footer, **TXT** and **MD** download the active note's exact body without modifying the note or stripping Markdown.
- Existing `notely.notes.v1` and `notely.theme.v1` storage keys and the existing stored data are unchanged; v1.6.0 additionally requires `contextMenus`. No migration is performed on stored notes until a write is required.

## v1.4.0 - Writing Experience

- Markdown writing toolbar: **bold**, *italic*, inline code, links, H2 headings, bulleted and numbered lists, and checklists. Formatting wraps the selected text or prefixes selected lines; selection/cursor are restored to the textarea.
- **Preview** toggles a safe, lightweight Markdown renderer built exclusively with DOM nodes and text content. Raw HTML is displayed as text, never inserted as executable HTML. Links accept `https:` and `http:` only; other URI schemes stay plain text.
- Preview checkboxes modify their corresponding Markdown source lines (`- [ ]` / `- [x]`) and go through the existing auto-save queue. Switch back to **Edit** to modify source text.
- Existing notes remain normal plain-text `body` values under the same `notely.notes.v1` storage key; no migration is run. Markdown syntax is optional, and original source is never replaced by rendered HTML.
- Markdown preview supports headings (H1-H3), lists, checklists, code fences, inline code, bold, italic, links, block quotes and paragraphs. This is intentionally a Markdown subset, not full CommonMark or GitHub Flavored Markdown.

## v1.3.0 - Organization & Search

- Add up to 12 tags (32 characters each) per note using the **Tags** input: type a tag and press Enter or comma. Remove with the adjacent X. To rename a tag, remove it and add its replacement.
- Search across all note fields or narrow to **Titles**, **Content**, or **Tags**. Combine the query with a selected tag and the **Favorites** toggle; all selected conditions must match.
- Sort by **Last edited**, **Date created**, or **Title A-Z**; pinned notes remain first regardless of sort choice.
- Mark notes as favorites independently of the existing Pin action. The search list shows star icons and a compact tag preview.
- Compatibility: the persistent storage key remains `notely.notes.v1`. v1.2.0 notes gain optional `favorite: false` and `tags: []` in memory without changing their titles, body text, IDs, timestamps or pinned status. No destructive migration is run. Existing entries are only written back after an edit.

## Features

- Create, edit, pin, search and delete multiple notes in a compact 400 × 580 px popup.
- Auto-save through a single-flight popup queue and serialized service-worker coordinator: one authoritative stored-array write at a time. Earlier queued edits cannot persist after newer edits. New edits retain their in-memory state if a write fails.
- Visible **Saving**, **Saved**, or **Not saved - retry** indicator on both list and editor screens, with an explicit **Retry** button on failures.
- Delete confirmation, followed by **Undo** for up to 9 seconds while the popup remains open.
- Dark and light themes, word counts, keyboard focus and safe handling of empty and long notes.

### Keyboard

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd+N` | New note; focus title |
| `Ctrl/Cmd+K` | Insert Markdown link when editing the body; otherwise search |
| `/` | Search when outside text inputs |
| `Ctrl/Cmd+S` | Retry/flush latest note snapshot |
| `Ctrl/Cmd+Enter` | From title, focus note body |
| `Escape` | Return to list; focus previous note |
| `Ctrl/Cmd+B` | Bold selected text in the note body |
| `Ctrl/Cmd+I` | Italic selected text in the note body |
| `Ctrl/Cmd+Shift+C` | Inline code in the note body |
| `Ctrl/Cmd+Shift+P` | Toggle Markdown preview in the editor |

The popup closes when it loses focus, which is standard Chrome behavior. **Undo is available only while the popup remains open.** Storage failures leave the current edited notes in popup memory so you can retry **before closing**. Chrome can terminate a popup during a pending write; no browser popup can promise persistence when Chrome forcibly terminates a write or storage is unavailable.

## Privacy and limitations

Data remains in `chrome.storage.local` in the extension's Chrome profile; no sync or automatic cloud backup. Manual JSON backup and restore are available. Uninstalling the extension may delete its notes. Permissions: `storage`, `contextMenus` and `sidePanel` (as declared in the current manifest). Maximum 1,000 notes; 120-character titles and 100,000-character bodies per note; Chrome quota applies. Avoid using Notely as the sole copy of irreplaceable content.

## Verification

```sh
npm test
npm run check
```

Requires Node.js 18+ for tests only. No npm dependencies are required for the Chrome extension. Manifest V3, minimum Chrome 114. Target-Chrome interactions should be tested after unpacked installation.

## Verification boundary

The Node.js tests cover the backup format, import plans, save-failure rollback, note model, v1.2/v1.3 compatibility, query/filter/sort behavior, the single-flight persistence queue, Markdown parsing, HTML-injection safety, checklist updates, and cursor-aware editing transformations. Syntax and archive checks are also available offline. Actual Chrome extension popup behavior, focus transitions, and storage integration require testing in a real browser after installation; passing Node tests does not certify those behaviors.

## v1.5.0 verification limits

Node tests verify pure data transformations and the queue adapter under simulated asynchronous saves; they cannot guarantee that Chrome's native file chooser, download permission behavior, popup persistence or filesystem interactions work on the target device. The import is not an all-or-nothing cross-process transaction across a browser crash. An actual Chrome popup smoke test, including a backup download, an import and a relaunch, remains necessary before a stable release. If storage is unavailable, do not close the popup before verifying data safety.


## Full workspace (v1.7)

Click the **Open full workspace** icon in the popup header to open Notely in a browser tab. The tab uses the same `popup.html`, `popup.js`, stylesheet and storage coordinator as the quick popup, with the `?workspace=1` layout mode. No new permissions or dependencies are required. On wide screens, the notes list and editor appear side by side; narrow screens retain list/editor navigation. This does not create a separate data store. Opening a new tab does not force an unsaved popup edit to be persisted: check **Saved** before leaving the popup.

## v1.9.0 - Writing Experience 2.0

- **Focus mode**: use the Focus button or Ctrl+Shift+F in full workspace. The navigation sidebar is hidden but the editor remains accessible.
- **Resizable sidebar**: drag the separator on wide workspaces or use Left/Right arrows (20 px), Home (260 px), End (520 px) while it is focused. The size is local to the open tab.
- **Draft recovery**: title and body edits create a separate recovery record under `notely.recovery.v1.<window-id>` in `chrome.storage.local`. Successful saves request cleanup. On reopening, an unsaved draft appears in a banner and may be restored **as a new note**, never replacing an existing note automatically. Discard explicitly removes the recovery record. Drafts from independently open windows use independent keys. This is a best-effort safety net: browser termination before the asynchronous recovery write completes, quota failures and simultaneous save failures can still cause data loss. The user should verify **Saved** before closing.
- Recovery records are local device data, not included in JSON backups. Clearing extension storage removes them.
- No new runtime dependencies, and the existing notes schema and backup format are unchanged.


### v1.9.1 - Reliability patch (2026-11-13)

- Repeated recovery attempts after a failed write reuse the same recovered note instead of creating duplicates. Recovery remains an explicit copy and the source draft is retained until confirmed saved.
- Theme and capture-source controls revert to their previous visible state if preference persistence fails; controls are disabled while their write is pending.
- The storage schema, backup format, extension ID assumptions, dependencies and permissions are unchanged.
- Verification: Node tests and syntax checks; native Chrome extension execution must still be checked in a real installed browser.

### v1.9.3 - Popup notes-first layout

- Search and create remain visible; optional filters and sorting are grouped under an accessible, keyboard-operable disclosure. Expand **Filters & sorting** to access Search in, Sort by, Tag and Favorites.
- Reduced fixed header spacing in popup and side panel to give the scrollable note list more room.
- Full workspace layout and note storage formats remain unchanged.
- A visual regression test checks the collapsed and expanded states at popup and side-panel sizes.


P1 responsive/UX changes and QA limitations: see `P1-IMPLEMENTATION-REPORT.md`.


### P2 UI refinement (2.0.10)
Theme duplication removed, shared interactive states standardized, and component geometry/motion connected to design tokens. See `P2-UI-COMPONENT-REFINEMENT.md`.

## v2.0.10 Visual Polish

See `P2-VISUAL-POLISH-REPORT.md` for the scoped CSS changes and verification.

## Brand release v2.0.10
See `brand/ASSET-MANIFEST.md` and `store-assets/STORE-LISTING.md`; store illustrations are not real extension screenshots.

### v2.0.10 audit and QA

Backup replacement now requires the notes to match the snapshot visible when the backup file was previewed. If notes change while the preview is open, reselect the file to review the new state. The theme control updates its accessible action name. The startup indicator reflects pending or failed saves instead of always reporting `Saved`.

Locally supported checks: `npm run check`, `npm test`, `python qa-workspace-layout.py`, and `python qa-visual-layout-v210.py` (the Python visual checks require Playwright and Chromium and are optional). Static screenshots are not a substitute for an installed Chrome extension.

## Optional donation (v2.0.13)

The **Support** action in the sidebar footer opens an optional, locally rendered USDC-on-Solana donation dialog. Its static QR code and copyable address are validated against the supplied Binance USDC/Solana deposit QR. No wallet access, transaction creation, external requests, dependencies or permissions are added. Confirm the Binance deposit address and any deposit requirements before sending; deposits may be subject to change.


### v2.0.15 — Support dialog repair
The voluntary USDC donation dialog now uses a compact Notely-native layout with one selectable receiving address, a smaller QR code, and viewport-safe internal scrolling for narrow/short panels. See `P2-SUPPORT-DIALOG-REPAIR-V2.0.15.md`.

### v2.0.17 — Support dialog motion
Short entry/exit fade for voluntary support modal with native reduced-motion fallback. See `P2-SUPPORT-MOTION-V2.0.17.md`.
