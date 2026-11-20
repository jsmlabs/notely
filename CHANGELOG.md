# Changelog

Release history below describes **local candidates**, not Chrome Web Store publications.

## 2.1.3
- Prevent recovery confirmation from racing with discard and backup import while storage writes are pending.
- Preserve the draft and unlock controls after a failed recovery save.
- Add focused recovery-state regression tests.

## 2.1.2
- Invalidate pending backup-file reads when closing the import dialog.
- Clear stale backup replace selections and protect Support close-animation errors.

## 2.1.1
- Harden local release resource validation, including unsafe and external HTML references.

## 2.1.0
- Prepare extension assets, permissions disclosure and release-audit scripts.

## 2.0.x
- Introduce local data-integrity protection, responsive workspace improvements, a voluntary support dialog, bounded note previews and selected UI/performance repairs.

Detailed engineering reports: [Historical notes](docs/history/).
