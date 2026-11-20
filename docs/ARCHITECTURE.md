# Architecture

Notely is a no-build Chrome Manifest V3 extension built from plain HTML, CSS and JavaScript modules.

| Area | Source | Responsibility |
| --- | --- | --- |
| Extension entry points | `manifest.json`, `background.js` | Popup, side panel, service worker and context-menu entry |
| Main UI | `popup.html`, `popup.js`, `panel.html`, `sidepanel.html` | Notes, editor, workspace and panel surfaces |
| Persistence | `coordinator.mjs`, `storage-queue.mjs`, `core.mjs` | Serialization, storage boundaries and note operations |
| Backup & recovery | `backup.mjs`, `draft-recovery.mjs`, `import-selection.mjs`, `import-preview-guard.mjs` | Export/import, staged changes and recovery |
| Presentation | `design-tokens.css`, `styles.css`, `motion.css`, `brand/`, `icons/` | Theme, visual styles, animations and assets |
| Validation | `tests/`, `scripts/audit-release.mjs` | Simulated behavior and deterministic release/resource checks |

## Invariants

- Chrome storage key `notely.notes.v1` and backup schema version 1 must not be silently migrated.
- Corrupt stored note lists should fail closed rather than silently discarding records.
- Serialized writes and conflict/recovery handling prevent known races in the tested simulated scenarios.
- Existing optional support uses a static address/QR, not payment processing.
- No host permissions, remote code or additional runtime dependencies are needed.

## What is not proven

Local tests do not establish correctness in an installed MV3 extension across real Chrome profiles, multiple windows, process suspension, or extension updates. Those are distinct release gates.
