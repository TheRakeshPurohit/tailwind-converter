# Tailwind Converter

Tailwind Converter helps migrate plain HTML and CSS into HTML with Tailwind CSS classes. It is designed as a migration assistant: it converts what can be mapped safely, approximates values when requested, and preserves unsupported CSS for review instead of silently dropping it.

The app targets Tailwind CSS v4 and uses a CSS-first Vite setup.

## Features

- Paste or edit HTML and CSS side by side.
- Convert CSS declarations into Tailwind classes.
- Choose between conversion modes:
  - **Tokens:** clean Tailwind classes using the closest design token.
  - **Exact:** arbitrary-value classes when exact values matter.
- Review converted, approximated, unsupported, and preserved CSS.
- Filter review output by selector and status.
- Preserve unsupported CSS in a leftover `<style>` block.
- Copy generated HTML or preserved CSS separately.
- Compare original and converted output in the Preview tab.
- Switch preview viewport between desktop, tablet, and mobile.
- Preview HTML is sanitized and user-provided scripts are stripped.

See [SupportedClasses.md](SupportedClasses.md) for detailed support notes.

## How Conversion Works

1. CSS is parsed with PostCSS.
2. Safe selectors are matched against the input HTML.
3. Supported pseudo-classes become Tailwind variants, such as `hover:`.
4. Supported media queries become responsive prefixes, such as `md:`.
5. Shorthands like `margin`, `padding`, `border`, `background`, and `font` are normalized when safe.
6. Declarations are converted to Tailwind classes.
7. Unsupported or risky CSS is preserved and shown in the review workflow.

The generated HTML remains self-contained when leftover CSS is needed.

## Conversion Modes

### Tokens

Tokens mode favors idiomatic Tailwind classes.

```css
.card {
  margin: 17px;
}
```

```html
<div class="m-4"></div>
```

### Exact

Exact mode favors visual fidelity with arbitrary values.

```css
.card {
  margin: 17px;
}
```

```html
<div class="m-[17px]"></div>
```

## Current Limitations

Tailwind Converter is not a lossless CSS compiler. Some CSS cannot be safely represented as one-element Tailwind classes, especially CSS that depends on selector relationships or generated content.

Common limitations include:

- complex selectors such as `.card > h2`
- pseudo-elements such as `::before` and `::after`
- drop shadows
- ring, divide, and space utilities
- complex named grid placement and advanced grid templates
- background images and gradients in Tokens mode
- animation and keyframes
- CSS variables as Tailwind theme tokens
- container queries

Unsupported CSS is preserved for review when possible.

## Run Locally

```bash
git clone https://github.com/kt474/tailwind-converter.git
cd tailwind-converter
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:visual
```

## Visual Regression Tests

The visual regression harness renders original HTML/CSS and converted
HTML/Tailwind output in Chromium, screenshots desktop/tablet/mobile viewports,
and compares them with a pixel mismatch budget.

Install the Playwright browser once:

```bash
npx playwright install chromium
```

Run the visual suite:

```bash
npm run test:visual
```

Screenshots and diffs are written to `test-artifacts/visual` for review and are
ignored by git.

## Project Status

This project has been revived from an earlier prototype. The current direction is practical migration support rather than perfect automatic conversion. The Review and Preview workflows are core parts of that approach: they make approximations, preserved CSS, and visual differences visible.

Useful next milestones:

- Improve scriptless converted preview rendering.
- Add more unsupported-property classification.
- Expand support for advanced grid templates, gradient stop utilities, and drop shadows.
- Add relationship-aware conversions for `space-*` and `divide-*`.
