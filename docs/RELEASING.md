# Release checklist

## Locally available checks

```bash
npm run check
npm test
npm run audit:release
```

Verify that `manifest.json` and `package.json` have matching versions, referenced assets are present, and no user data, secrets, signing keys or generated logs are packaged. Inspect the ZIP contents after packaging.

## Unverified gates (do not mark as passing)

- Install/load the unpacked extension in a supported Google Chrome build.
- Exercise popup, side panel, full workspace, context capture, local storage, repeated dialogs and real multi-window edits.
- Test backup/restore on disposable sample data, including failure and recovery paths.
- Produce actual installed-extension screenshots suitable for a store listing.
- Finalize publisher-owned public privacy policy/support links and disclosures.
- Choose a source license before accepting external distribution/contributions.
- Submit to the Chrome Web Store only after publication authorization and verification.

**Current status:** local source candidate v2.1.3; no evidence of Chrome Web Store publication.
