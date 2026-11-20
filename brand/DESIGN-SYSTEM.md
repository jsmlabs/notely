# Notely — Production Design System v1.1

Applies to **Notely 2.0.8**: popup, Chrome side panel, and full workspace.
This is a visual-foundation pass, **not** a new navigation or editor feature.

## Token architecture

1. `design-tokens.css` is loaded first by all three HTML entrypoints.
2. `styles.css` contains the existing public/legacy semantic names (`--bg`, `--surface`, `--text`, etc.) and now aliases the new primitive theme tokens (`--color-*`). Existing component selectors continue working without API changes.
3. Dark and light primitives are scoped to `body[data-theme="dark"]` and `body[data-theme="light"]`; switching the existing theme setting updates aliases and all connected surfaces.
4. The icon master and browser PNGs intentionally remain fixed-color for brand recognition.

### Color roles

| Semantic role | Primitive | Usage |
| --- | --- | --- |
| `--bg` | `--color-bg` | Canvas |
| `--surface` | `--color-surface` | Panels/dialogs |
| `--surface-hover` | `--color-surface-hover` | Hover |
| `--border` / `--divider` | `--color-border` / `--color-divider` | Structural separation |
| `--field` | `--color-field` | Inputs |
| `--selected` | `--color-selected` | Selected note |
| `--text` / `--muted` / `--faint` | Corresponding `--color-*` | Hierarchical text |
| `--accent` / `--accent-text` | Corresponding `--color-*` | Primary actions and focus |
| `--danger` | `--color-danger` | Destructive/error UI |
| `--shadow` | `--color-shadow` | Dialog shadow |

Values in `design-tokens.css` were extracted from the **previously active** v2.0.4 theme blocks to avoid an unvalidated recoloring. Earlier declarations in `styles.css` remain for backward compatibility but are superseded by the final alias rules.

### Dimension and motion scales

| Group | Variables | Values |
| --- | --- | --- |
| Spacing | `--space-1` through `--space-6` | 4, 8, 12, 16, 24, 32px |
| Radii | `--radius-sm/md/lg/xl` | 6, 9, 12, 16px |
| Controls | `--control-sm/md/lg` | 32, 38, 40px |
| Icons | `--icon-md` | 18px |
| Motion | `--duration-fast/normal` | 120/150ms |
| Focus | `--focus-width` | 2px |

The existing layout-specific heights, text sizes, and radii remain in place unless a component explicitly opts into a token. This avoids accidental responsive regressions. New components should use tokens instead of introducing new literals; consolidate older selectors only when paired with layout verification.

## Component contract

- **Brand header:** self-contained 32px mark and lower-case wordmark; no network fonts.
- **Primary action:** accent foreground/background from semantic pair; one obvious creation entry point per view.
- **Search:** field background from `--field`, visible focus, shared dimensions in narrow surfaces.
- **Note list:** `--selected` for selected notes, `--surface-hover` for hover; preserve note ID, scroll and keyboard focus during list updates.
- **Editor:** visible field focus, existing Markdown controls and save/error state semantics; do not present unsupported rich text controls.
- **Dialogs:** `--surface`, `--border`, `--shadow`; no fixed background imagery.
- **Motion:** respect `prefers-reduced-motion: reduce`.

## Scope & verification

Checked locally: static token references, stylesheet order, existing JS regression suite and ZIP archive contents. **Not checked** in this phase: installed extension, screen reader, 200% zoom, browser storage interactions or final per-device visual signoff. These remain deliberately skipped at the user's request.

## Visual finishing v2.0.8
Cross-surface styling now explicitly shares component corner radius, focus outline, selected backgrounds and branded icon sizing. Previous layout-specific rules remain unchanged.
