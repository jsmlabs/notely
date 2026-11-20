# Privacy & permissions — draft for publisher review (Notely v2.1.1)

## Single purpose

Create, organize, and retrieve private notes in Chrome, including user-invoked capture of selected page text.

## Manifest permissions

- **`storage`** — persist notes, preferences and draft-recovery information in local Chrome storage.
- **`contextMenus`** — expose the user-invoked “Save selection to Notely” context-menu item.
- **`sidePanel`** — allow the side-panel note-taking interface.

No host permissions, content scripts, remote code or automatic cloud sync are declared in `manifest.json`.

## Data flows evidenced in source

- User-authored notes and optionally captured selection/page title/source URL are saved to local Chrome storage. Source metadata capture is configurable.
- Backup JSON may be exported by user action; imported backup JSON is processed locally. No automatic remote transfer is implemented in the inspected sources.
- Optional USDC donation is a static address/QR and copy feature. No wallet connection or payment API is implemented.
- Uninstalling or clearing profile/extension data may remove notes; users should keep their own backups.

## Publication boundary

This is a **draft**, not a hosted public privacy policy and not a legal compliance certification. Publisher must verify claims with an installed build, finalize a public policy/support URL, and complete Chrome Web Store privacy dashboard declarations, including data practices and any required Limited Use statement. Avoid asserting features or data practices that have not been checked.

Review Google's current requirements at https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/ and https://developer.chrome.com/docs/webstore/program-policies/policies.
