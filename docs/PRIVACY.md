# Privacy & data handling (source-based disclosure)

Notely is designed as a **local-first** extension. The inspected Manifest V3 source declares `storage`, `contextMenus` and `sidePanel` permissions, with no host permissions or declared content scripts.

- Notes, settings, optional capture metadata and draft-recovery state use Chrome's local extension storage.
- Users manually export/import JSON backups; backups may contain their notes and source metadata.
- No account, analytics, automatic cloud sync, remote payment API or wallet integration is implemented in the inspected candidate.
- The optional USDC-on-Solana support interface displays a static address/QR only; verify details with the intended recipient before sending funds.
- Clearing Chrome profile or extension storage can erase notes. Keep backups yourself.

**Publication status:** This is not a hosted, legally reviewed privacy policy. The publisher must verify claims in the installed extension, choose public support and privacy URLs, and finish current Chrome Web Store declarations before distribution. See `store-assets/PRIVACY-AND-PERMISSIONS-DRAFT.md`.
