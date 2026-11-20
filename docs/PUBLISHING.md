# Publish to GitHub

The connected GitHub account `jsmlabs` did **not** contain a `notely` repository when this package was prepared. The available connected API does not expose repository creation; this directory has not been pushed remotely.

## Recommended repository settings

- **Owner:** `jsmlabs` (verify this is still the intended account)
- **Repository name:** `notely`
- **Description:** `A minimal, local-first Chrome notes extension with Markdown, quick capture, and private backups.`
- **Visibility:** **Private by default** until you intentionally approve publication, source license and the custodial donation address disclosed in the extension.
- **Default branch:** `main`
- **Topics:** `chrome-extension`, `manifest-v3`, `notes`, `markdown`, `local-first`, `privacy`, `javascript`
- **Initialize with README/.gitignore/license:** **No** (all needed files are already in this package; no license has been selected).

## Push using Git

1. Create an empty repository at https://github.com/new under the intended owner.
2. Extract this ZIP into a project directory.
3. From that directory, run:

```bash
git init -b main
git add .
git commit -m "chore: initialize Notely v2.1.3 repository"
git remote add origin https://github.com/jsmlabs/notely.git
git push -u origin main
```

If you have local changes or an existing remote, reconcile them **before** pushing. Do not force-push or overwrite other content.

## Follow-up after publishing

Configure repository description/topics, enable Actions if desired, choose branch protections, review the issue form and ensure the CI workflow runs. Do not claim the Chrome Web Store release is complete. The public privacy/support contacts and installed-MV3 verification remain open gates. Select a license deliberately if you want others to redistribute or reuse the source.
