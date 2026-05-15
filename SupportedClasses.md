# Supported CSS Conversion

Tailwind Converter is a migration helper, not a lossless CSS compiler. It converts safe CSS declarations to Tailwind classes, approximates values to Tailwind's design scale in token mode, and preserves risky or unsupported CSS in a leftover `<style>` block for review.

## Conversion Modes

- **Tokens mode** maps values to the closest Tailwind design token. Example: `margin: 17px` becomes `m-4`.
- **Exact mode** uses Tailwind arbitrary values when possible. Example: `margin: 17px` becomes `m-[17px]`.

The Review panel shows what was converted, approximated, unsupported, or preserved.

## Selector Support

### Converted directly

- Tag selectors: `body`, `h1`, `p`
- Single class selectors: `.card`, `.button`
- Safe comma selector lists: `h1, h2`, `.card, .panel`

### Converted to Tailwind variants

- `:hover`
- `:focus`
- `:active`
- `:visited`
- `:disabled`
- `:checked`
- `:focus-visible`
- `:focus-within`
- `:required`
- `:invalid`
- `:valid`
- `:enabled`
- `:first-child`
- `:last-child`
- `:nth-child(odd)`
- `:nth-child(even)`

Example:

```css
.button:hover {
  color: red;
}
```

becomes:

```html
class="hover:text-red-600"
```

### Preserved for review

- Descendant and child selectors: `.card h2`, `.card > h2`
- Attribute selectors: `[data-state="open"]`
- Pseudo-elements: `::before`, `::after`
- Complex selector chains
- Unsupported or custom at-rules

## Responsive Media Queries

The following media queries become Tailwind responsive prefixes:

| CSS media query | Tailwind prefix |
| --- | --- |
| `@media (min-width: 640px)` or `40rem` | `sm:` |
| `@media (min-width: 768px)` or `48rem` | `md:` |
| `@media (min-width: 1024px)` or `64rem` | `lg:` |
| `@media (min-width: 1280px)` or `80rem` | `xl:` |
| `@media (min-width: 1536px)` or `96rem` | `2xl:` |

Other media queries are preserved for review.

## Supported Shorthands

- `margin`
- `padding`
- `border`
- `border-top`
- `border-right`
- `border-bottom`
- `border-left`
- `border-color`
- `background` when it is a color-only shorthand
- `font` for conservative size/style/weight/line-height/family cases

Examples:

```css
padding: 8px 16px;
border: 1px solid red;
font: italic 700 16px/1.5 sans-serif;
```

can become:

```html
class="pt-2 pr-4 pb-2 pl-4 border border-solid border-red-600 italic font-bold text-base leading-normal font-sans"
```

Compound background shorthands such as `background: url(...) center / cover no-repeat` are preserved for review.

## Property Families

### Generally supported

- **Layout:** display, position, top/right/bottom/left, z-index, box sizing, overflow, object fit, object position, visibility, float, clear, isolation, columns
- **Flexbox and grid basics:** flex direction, flex wrap, flex grow, flex shrink, flex basis, order, gap, row gap, column gap, justify, align, place, grid auto flow, grid auto columns, grid auto rows, simple grid templates
- **Spacing:** margin, padding, gap, scroll margin, scroll padding
- **Sizing:** width, height, min/max width, min/max height
- **Typography:** font family, font size, font style, font weight, line height, letter spacing, text align, text color, text decoration, text transform, text overflow, text indent, vertical align, whitespace, word break, list style
- **Backgrounds:** background color, attachment, clip, origin, position, repeat, size, exact-mode background image
- **Borders and outlines:** border width, border color, border style, border radius, outline width, outline color, outline style, outline offset
- **Effects:** opacity, box shadow, mix blend mode, background blend mode
- **Filters:** blur, brightness, contrast, grayscale, hue rotate, invert, saturate, sepia, and backdrop equivalents
- **Transforms:** scale, rotate, translate, skew, transform origin
- **Interactivity:** cursor, appearance, accent color, caret color, pointer events, resize, scroll behavior, scroll snap, touch action, user select, will change, transition property, transition duration, transition delay, transition timing function
- **SVG:** fill, stroke, stroke width

### Not currently converted

- Container queries
- CSS variables as Tailwind theme tokens
- Complex grid templates and grid line placement
- Space-between utilities from sibling relationships
- Divide and ring utilities
- Drop shadow
- Background images and gradients in token mode
- Animation
- Border spacing
- Screen reader utilities
- Arbitrary selector relationships that require changing HTML structure

Unsupported declarations are preserved in leftover CSS when possible.

## Tailwind Utility Families Not Yet Covered

Some Tailwind utility families are not generated because their underlying CSS is unsupported, relationship-based, or implemented by Tailwind-specific variables rather than a direct CSS declaration.

| Tailwind utility family | Related CSS | Current status |
| --- | --- | --- |
| `shadow-*` | `box-shadow` | Supported. Tokens mode maps to the nearest Tailwind v4 shadow token; Exact mode uses arbitrary values. |
| `drop-shadow-*` | `filter: drop-shadow(...)` | Preserved for review |
| `ring-*`, `ring-offset-*` | Tailwind ring variables and `box-shadow` | Not converted |
| `divide-*` | Child/sibling border selectors | Not converted |
| `space-x-*`, `space-y-*` | Child/sibling margin selectors | Not converted |
| `grid-cols-*`, `grid-rows-*` | `grid-template-columns`, `grid-template-rows` | Supports `none`, `subgrid`, and `repeat(1..12, minmax(0, 1fr))`. Exact mode uses arbitrary values. |
| `col-span-*`, `row-span-*`, `col-start-*`, `row-start-*` | `grid-column`, `grid-row` | Mostly not converted |
| Arbitrary `bg` background image utilities | `background-image` | Exact mode only. Tokens mode preserves background images and gradients for review. |
| Gradient utilities such as `from-*`, `via-*`, `to-*` | Gradient stops | Not converted |
| `animate-*` | `animation`, `@keyframes` | Not converted |
| `transition-*`, `ease-*` | `transition-property`, `transition-duration`, `transition-delay`, `transition-timing-function` | Supports common Tailwind transition families and conservative one-item `transition` shorthands. Exact mode uses arbitrary values. |
| `container` and container query utilities | Container sizing/query behavior | Not converted |
| `sr-only`, `not-sr-only` | Compound accessibility declarations | Not converted |
| `before:*`, `after:*` | `::before`, `::after`, `content` | Pseudo-elements are preserved for review |

These gaps are good candidates for future focused milestones. Relationship-based utilities such as `space-*` and `divide-*` will likely need HTML structure analysis, not just declaration conversion.

## Important Notes

- Color conversion uses nearest Tailwind color matching, so named colors may map to a nearby shade such as `red` to `red-600`.
- Token mode prioritizes clean Tailwind classes over exact visual fidelity.
- Exact mode prioritizes fidelity by using arbitrary values where the converter knows the matching utility prefix.
- The Preview tab is for visual comparison. User-provided preview HTML is sanitized and scripts are stripped.
