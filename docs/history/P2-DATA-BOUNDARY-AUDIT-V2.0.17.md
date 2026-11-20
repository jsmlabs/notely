# Notely v2.0.17 — Data Boundary Audit

## Findings and repairs

1. **Invalid persisted dates:** `normalizeNote` previously accepted numbers too large for the JavaScript Date range. Date formatting could throw `RangeError`, interrupting note rendering. Timestamps are now required to be nonnegative safe integers inside the supported Date range. Invalid legacy values are normalized on loading; the UI includes a defensive fallback.
2. **Inconsistent source URL validation:** Backup files previously accepted malformed `http(s)` strings based only on a regular expression. One shared parser-based validator now covers captured URLs, stored notes, and imports. Credential-bearing HTTP(S) URLs are rejected to avoid misleading source attribution.

## Compatibility

- No schema, permission, or runtime dependency changes.
- Invalid legacy timestamps are replaced by the time of normalization, rather than causing the UI to crash.
- Import is strict and rejects malformed input without modifying the notebook.
- Donation QR and payout destination unchanged.

## Verification

See `QA-V217.txt` for executed Node tests and `QA-V217-CHECK.txt` for syntax checks. Live installed-Chrome behavior is not established by Node checks.
