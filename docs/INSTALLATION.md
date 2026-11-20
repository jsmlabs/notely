# Install Notely from source

1. Download the project ZIP or clone the repository, then extract it to a persistent local directory.
2. Open **Google Chrome → `chrome://extensions`**.
3. Enable **Developer mode**.
4. Select **Load unpacked**, then select the folder containing `manifest.json`.
5. Pin Notely in the toolbar if desired; open the popup, the full-tab workspace, or the side panel.

No build command is required. Do not select a parent directory that does not contain `manifest.json`.

## Updating

Keep regular JSON backups of your notes before changing extension files. Replace source files in the same unpacked extension directory, then select **Reload** on `chrome://extensions`. Changing the source path or installation identity can affect access to existing Chrome extension storage; verify existing notes before removing any previous installation. Never assume reinstalling an extension preserves its local data.

## Troubleshooting

- **Cannot load manifest:** select the correct folder and check `manifest.json` is intact.
- **Popup is blank:** open the extension's error inspection in `chrome://extensions` and save the console message without sharing personal notes.
- **Notes missing:** stop making changes, check whether the same extension installation/profile is being used, and restore from a verified backup if needed.
- **Import fails:** inspect validation errors and keep the original file; do not edit it destructively.

## Verification status

The source currently has automated Node tests and limited Chromium DOM/layout checks. A complete installation smoke test in Chrome, native multi-window coordination and full accessibility acceptance have not been completed as part of the supplied candidate.
