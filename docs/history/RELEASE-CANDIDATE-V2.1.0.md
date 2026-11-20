# Notely v2.1.0 — Release candidate report

## Scope

Prepared **a local release candidate**, not a Store publication. Kept note keys, backup format, coordinator, UI and donation recipient untouched. Incremented manifest/package to v2.1.0 and updated release-facing docs.

## Static release checks

Execute `npm run audit:release`; it validates manifest/package version parity, declared runtime resources, HTML-linked local assets, store PNG header/dimensions, least-privilege permission allowlist, absence of host permissions/content scripts/remote code declarations, and disclosure copy. `npm test` and `npm run check` verify source with their respective boundaries.

## Open external/publication gates (NOT VERIFIED)

1. Install unpacked extension in Chrome and test popup, native side panel, workspace, context menu, shortcuts, storage lifecycle, backup download/import, reopen flows and parallel edits.
2. Produce real extension screenshots meeting Store requirements. Existing QA fixture captures are not accepted as authentic installed-extension screenshots.
3. Publisher supplies/validates public privacy and support links, account and privacy disclosures and any legal jurisdiction requirements.
4. Review listing, payment-network warnings, description, and actual asset appearance in Store dashboard before upload/submission.
5. Store submission, review and publication **not performed**.

## No migration

The version update changes only release metadata/documents and introduces release tooling. No existing user data or extension runtime source was changed.

## Executed candidate verification (2026-11-20)

- `npm run check` — PASS.
- `npm test` — PASS, 137/137.
- `npm run audit:release` — PASS, 7 manifest resources, 19 HTML-local resources and 7 PNG headers/dimensions.
- Independent PIL PNG decode — PASS, 8/8 assets including donation QR.
- Package byte-match and archive CRC — PASS (verified after assembly).
- No installed-Chrome, external download, dashboard upload, or actual store-policy approval was performed.
