# Notely v2.1.1 — Release Validation & Final Polish

## Changes

- Harden release audit: HTML `<script>`, `<link>` and `<img>` resources with single, double and unquoted values are checked; external URLs and path traversal fail the audit.
- Remove the fixed release version from the audit. Manifest/package equality and semantic version format are checked instead.
- Add three deterministic negative/positive regression tests for the resource parser.
- Update version, release documentation and roadmap. Preserve existing extension runtime, data, permissions, and donation behavior.

## Gates

Execute `npm run check`, `npm test` and `npm run audit:release` on this candidate. Packaging requires ZIP CRC verification and byte comparison to the tested source tree. These are static/source checks, not installed Chrome verification.

## Outstanding

- Native Chrome extension runtime and real storage/side-panel/context-menu operations: NOT VERIFIED.
- Authentic Chrome Web Store screenshots from the installed extension: NOT CREATED.
- Publisher-controlled privacy/support URLs and dashboard declarations: NOT FINALIZED.
- Submission/publication: NOT PERFORMED.
