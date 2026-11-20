# Notely — Brand Identity v1.0

## Positioning
Notely is a quiet, private, local-first note-taking companion for Chrome. It puts capturing and finding ideas ahead of dashboards, accounts or visual noise.

**Brand promise:** Your thoughts. In your space.

**Short description:** A clean, private space for notes, ideas, and quick captures.

**Voice:** Clear, calm, useful, direct. Use human-language microcopy; avoid hype, fake intelligence claims, and productivity pressure.

## Identity
The symbol pairs a simple folded note with an abstract lowercase **n** and one restrained green point. A dark rounded-square container gives a recognizable silhouette at browser toolbar sizes. Keep the wordmark lowercase as **notely.**

- Primary signature: dark icon + lowercase wordmark with a green period.
- Standalone: `mark.svg` for extension, favicons, and compact placements.
- Do not stretch, recolor each part independently, apply gradients, shadows, glow, strokes, or place the mark on low-contrast backgrounds.
- Minimum clear space: 12.5% of the icon width (16 px around a 128 px symbol).
- Use the standard brand mark for extension icon even in light theme for recognition.
- Use original editable SVG masters for future modifications.

## Palette

| Role | Hex | Usage |
| --- | --- | --- |
| Ink | `#151A1D` | Icon container, high-contrast branding |
| Paper | `#F4F5EF` | Folded-note silhouette, light-on-dark text |
| Sage | `#8CBF57` | Brand punctuation, detail and supporting highlights |
| Lime | `#D0EE8A` | Existing dark UI interactive accent |
| Evergreen | `#355C36` | Existing light UI accent |
| Night | `#0E1013` | Existing dark theme background |
| Day | `#FAFAF7` | Existing light theme background |

**Color contract:** The illustration uses fixed colors for brand recognition. Functional controls continue to use existing theme variables (`--accent`, `--accent-text`, `--text`, `--muted`, `--bg`, etc.). Preserve WCAG-readable text and visible keyboard focus rather than forcing the logo palette onto every UI surface.

## Typography

- UI: existing `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`. No network-loaded font.
- Brand wordmark: lowercase, semi-bold/bold, tight but legible tracking; keep the terminal period visually separate.
- Text: sentence case, minimal headings, readable secondary text; never use the brand's wide tracking on paragraphs.

## Asset Inventory

| File | Role |
| --- | --- |
| `mark.svg` | Canonical vector master for extension and application headers |
| `mark-light.svg` | Optional light-ground treatment for print or bright surfaces |
| `wordmark-dark.svg` | Lockup on dark surfaces |
| `wordmark-light.svg` | Lockup on light surfaces |
| `mark-256.png`, `mark-512.png` | Hi-res rendered exports |
| `../icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` | Extension manifest raster icons |

## Accessibility and implementation

- Decorative mark in the header uses `alt=""` and `aria-hidden="true"` because the nearby wordmark contains the product name.
- SVG files are fully self-contained: no JavaScript, linked fonts, external images or network resources.
- Keep icon details simple and visually inspect at 16px and 32px in installed Chrome.
- Popup, Chrome Side Panel, and full workspace share the same identity and CSS.
- Do not migrate or rename any note data keys for a branding-only update.

## Validation boundary

The included code checks can verify asset paths and markup. Exact browser toolbar rendering, real Chrome side-panel integration, and accessibility with an installed extension still require manual browser validation.

## Production token source (v2.0.5)

The authoritative UI palettes and foundation values now live in `../design-tokens.css`. See `DESIGN-SYSTEM.md` for theme mappings, component contracts and validation limits. The identity values above are the brand palette, not a replacement for interactive UI tokens.

## 2.0.8 distribution set

The canonical mark is unchanged. Generated monochrome/transparent treatments, 16–1024px PNG exports, and store illustrations are detailed in `ASSET-MANIFEST.md`. Promotional illustrations are not product screenshots. The store description is a draft, not an approved or published listing.
