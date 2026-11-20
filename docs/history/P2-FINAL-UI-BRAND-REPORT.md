# Notely v2.0.8 — P2 Final UI Consistency & Brand Assets

## Scope
- Preserved existing canonical logo geometry and styles.
- Added vector lockups, monochrome and transparent variants, seven icon raster sizes and aligned Chrome manifest icons.
- Produced original Chrome Web Store promotional graphics and draft listing metadata, explicitly separated from authentic screenshots.
- Harmonized cross-surface selected, focus, corner-radius and brand icon styling.
- No changes to note data, JavaScript behavior, permissions or network dependencies.

## Verification boundary
See execution summary for exact test counts. Static CSS checks do not establish installed-extension fidelity. Interactive runtime and accessibility acceptance remain skipped per user instruction. Real Chrome Web Store screenshots and publication remain pending.

## Executed verification (2026-11-20)
- `npm test`: **93/93 passing**, including 4 newly added brand/store/grid checks.
- `npm run check`: pass (JavaScript syntax).
- Headless Chromium static HTML/CSS layout check: 6 viewport widths (280, 360, 400, 700, 701, 1440 px), no horizontal document overflow; sampled note-title and editor text both 14 px.
- Visual inspection of 1440 px workspace found a pre-existing extra 5 px implicit grid track; corrected to two tracks and re-rendered successfully.
- Static screenshots use injected note rows and disabled scripts; relative brand images are not loaded by `set_content`, so they are **not** full extension previews.
- Skipped per user instruction: installed extension interactive runtime and screenreader/zoom formal acceptance.
- Not executed: real Chrome Web Store screenshots, account publication.
