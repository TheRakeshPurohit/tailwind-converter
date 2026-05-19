import DOMPurify from "dompurify";
import { colorCodes } from "./colors";

type UtilityRule = {
  selector: string;
  declarations: string;
  media?: string;
};

export const sanitizePreviewHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script"],
  });
};

export const sanitizePreviewCss = (css: string) => {
  return css.replace(/<\/style/gi, "<\\/style");
};

const breakpoints: { [variant: string]: string } = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
};

const pseudoVariants: { [variant: string]: string } = {
  hover: ":hover",
  focus: ":focus",
  active: ":active",
  visited: ":visited",
  disabled: ":disabled",
  checked: ":checked",
  "focus-visible": ":focus-visible",
  "focus-within": ":focus-within",
  required: ":required",
  invalid: ":invalid",
  valid: ":valid",
  enabled: ":enabled",
  first: ":first-child",
  last: ":last-child",
  odd: ":nth-child(odd)",
  even: ":nth-child(even)",
};

const fontSizes: { [utility: string]: string } = {
  "text-xs": "font-size: 0.75rem;",
  "text-sm": "font-size: 0.875rem;",
  "text-base": "font-size: 1rem;",
  "text-lg": "font-size: 1.125rem;",
  "text-xl": "font-size: 1.25rem;",
  "text-2xl": "font-size: 1.5rem;",
  "text-3xl": "font-size: 1.875rem;",
  "text-4xl": "font-size: 2.25rem;",
  "text-5xl": "font-size: 3rem;",
  "text-6xl": "font-size: 3.75rem;",
  "text-7xl": "font-size: 4.5rem;",
  "text-8xl": "font-size: 6rem;",
  "text-9xl": "font-size: 8rem;",
};

const gridTemplates = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const count = index + 1;
    return [
      `grid-cols-${count}`,
      `grid-template-columns: repeat(${count}, minmax(0, 1fr));`,
    ];
  })
);
const gridTemplateRows = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const count = index + 1;
    return [
      `grid-rows-${count}`,
      `grid-template-rows: repeat(${count}, minmax(0, 1fr));`,
    ];
  })
);

const staticUtilities: { [utility: string]: string } = {
  block: "display: block;",
  inline: "display: inline;",
  "inline-block": "display: inline-block;",
  flex: "display: flex;",
  "inline-flex": "display: inline-flex;",
  grid: "display: grid;",
  hidden: "display: none;",
  relative: "position: relative;",
  absolute: "position: absolute;",
  fixed: "position: fixed;",
  sticky: "position: sticky;",
  static: "position: static;",
  "flex-row": "flex-direction: row;",
  "flex-row-reverse": "flex-direction: row-reverse;",
  "flex-col": "flex-direction: column;",
  "flex-col-reverse": "flex-direction: column-reverse;",
  "flex-wrap": "flex-wrap: wrap;",
  "flex-nowrap": "flex-wrap: nowrap;",
  "flex-1": "flex: 1 1 0%;",
  "flex-auto": "flex: 1 1 auto;",
  "flex-initial": "flex: 0 1 auto;",
  "flex-none": "flex: none;",
  grow: "flex-grow: 1;",
  "grow-0": "flex-grow: 0;",
  shrink: "flex-shrink: 1;",
  "shrink-0": "flex-shrink: 0;",
  "justify-start": "justify-content: flex-start;",
  "justify-end": "justify-content: flex-end;",
  "justify-center": "justify-content: center;",
  "justify-between": "justify-content: space-between;",
  "justify-around": "justify-content: space-around;",
  "justify-evenly": "justify-content: space-evenly;",
  "items-start": "align-items: flex-start;",
  "items-end": "align-items: flex-end;",
  "items-center": "align-items: center;",
  "items-baseline": "align-items: baseline;",
  "items-stretch": "align-items: stretch;",
  "list-none": "list-style-type: none;",
  "list-disc": "list-style-type: disc;",
  "list-decimal": "list-style-type: decimal;",
  "list-inside": "list-style-position: inside;",
  "list-outside": "list-style-position: outside;",
  "text-left": "text-align: left;",
  "text-center": "text-align: center;",
  "text-right": "text-align: right;",
  "text-justify": "text-align: justify;",
  underline: "text-decoration-line: underline;",
  overline: "text-decoration-line: overline;",
  "line-through": "text-decoration-line: line-through;",
  "no-underline": "text-decoration-line: none;",
  uppercase: "text-transform: uppercase;",
  lowercase: "text-transform: lowercase;",
  capitalize: "text-transform: capitalize;",
  "normal-case": "text-transform: none;",
  "align-baseline": "vertical-align: baseline;",
  "align-top": "vertical-align: top;",
  "align-middle": "vertical-align: middle;",
  "align-bottom": "vertical-align: bottom;",
  "align-text-top": "vertical-align: text-top;",
  "align-text-bottom": "vertical-align: text-bottom;",
  "align-sub": "vertical-align: sub;",
  "align-super": "vertical-align: super;",
  "whitespace-normal": "white-space: normal;",
  "whitespace-nowrap": "white-space: nowrap;",
  "whitespace-pre": "white-space: pre;",
  "whitespace-pre-line": "white-space: pre-line;",
  "whitespace-pre-wrap": "white-space: pre-wrap;",
  italic: "font-style: italic;",
  "non-italic": "font-style: normal;",
  "font-thin": "font-weight: 100;",
  "font-extralight": "font-weight: 200;",
  "font-light": "font-weight: 300;",
  "font-normal": "font-weight: 400;",
  "font-medium": "font-weight: 500;",
  "font-semibold": "font-weight: 600;",
  "font-bold": "font-weight: 700;",
  "font-extrabold": "font-weight: 800;",
  "font-black": "font-weight: 900;",
  "font-sans": "font-family: ui-sans-serif, system-ui, sans-serif;",
  "font-serif": "font-family: ui-serif, Georgia, serif;",
  "font-mono": "font-family: ui-monospace, SFMono-Regular, monospace;",
  "leading-none": "line-height: 1;",
  "leading-tight": "line-height: 1.25;",
  "leading-snug": "line-height: 1.375;",
  "leading-normal": "line-height: 1.5;",
  "leading-relaxed": "line-height: 1.625;",
  "leading-loose": "line-height: 2;",
  "tracking-tighter": "letter-spacing: -0.05em;",
  "tracking-tight": "letter-spacing: -0.025em;",
  "tracking-normal": "letter-spacing: 0em;",
  "tracking-wide": "letter-spacing: 0.025em;",
  "tracking-wider": "letter-spacing: 0.05em;",
  "tracking-widest": "letter-spacing: 0.1em;",
  "break-normal": "overflow-wrap: normal; word-break: normal;",
  "break-words": "overflow-wrap: break-word;",
  "break-all": "word-break: break-all;",
  "break-keep": "word-break: keep-all;",
  border: "border-width: 1px;",
  "border-t": "border-top-width: 1px;",
  "border-r": "border-right-width: 1px;",
  "border-b": "border-bottom-width: 1px;",
  "border-l": "border-left-width: 1px;",
  "border-0": "border-width: 0;",
  "border-2": "border-width: 2px;",
  "border-4": "border-width: 4px;",
  "border-8": "border-width: 8px;",
  "border-solid": "border-style: solid;",
  "border-dashed": "border-style: dashed;",
  "border-dotted": "border-style: dotted;",
  "border-double": "border-style: double;",
  "border-none": "border-style: none;",
  "rounded-none": "border-radius: 0;",
  "rounded-sm": "border-radius: 0.125rem;",
  rounded: "border-radius: 0.25rem;",
  "rounded-md": "border-radius: 0.375rem;",
  "rounded-lg": "border-radius: 0.5rem;",
  "rounded-xl": "border-radius: 0.75rem;",
  "rounded-2xl": "border-radius: 1rem;",
  "rounded-3xl": "border-radius: 1.5rem;",
  "rounded-full": "border-radius: 9999px;",
  "overflow-auto": "overflow: auto;",
  "overflow-hidden": "overflow: hidden;",
  "overflow-clip": "overflow: clip;",
  "overflow-visible": "overflow: visible;",
  "overflow-scroll": "overflow: scroll;",
  "overflow-x-auto": "overflow-x: auto;",
  "overflow-x-hidden": "overflow-x: hidden;",
  "overflow-x-clip": "overflow-x: clip;",
  "overflow-x-visible": "overflow-x: visible;",
  "overflow-x-scroll": "overflow-x: scroll;",
  "overflow-y-auto": "overflow-y: auto;",
  "overflow-y-hidden": "overflow-y: hidden;",
  "overflow-y-clip": "overflow-y: clip;",
  "overflow-y-visible": "overflow-y: visible;",
  "overflow-y-scroll": "overflow-y: scroll;",
  visible: "visibility: visible;",
  invisible: "visibility: hidden;",
  "box-border": "box-sizing: border-box;",
  "box-content": "box-sizing: content-box;",
  "object-contain": "object-fit: contain;",
  "object-cover": "object-fit: cover;",
  "object-fill": "object-fit: fill;",
  "object-none": "object-fit: none;",
  "object-scale-down": "object-fit: scale-down;",
  "appearance-none": "appearance: none;",
  "pointer-events-none": "pointer-events: none;",
  "pointer-events-auto": "pointer-events: auto;",
  "select-none": "user-select: none;",
  "select-text": "user-select: text;",
  "select-all": "user-select: all;",
  "select-auto": "user-select: auto;",
  "resize-none": "resize: none;",
  "resize-y": "resize: vertical;",
  "resize-x": "resize: horizontal;",
  resize: "resize: both;",
  "grid-cols-none": "grid-template-columns: none;",
  "grid-cols-subgrid": "grid-template-columns: subgrid;",
  "grid-rows-none": "grid-template-rows: none;",
  "grid-rows-subgrid": "grid-template-rows: subgrid;",
  transition:
    "transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-duration: 150ms; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);",
  "transition-none": "transition-property: none;",
  "transition-all": "transition-property: all;",
  "transition-colors":
    "transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;",
  "transition-opacity": "transition-property: opacity;",
  "transition-shadow": "transition-property: box-shadow;",
  "transition-transform": "transition-property: transform;",
  "ease-linear": "transition-timing-function: linear;",
  "ease-in": "transition-timing-function: cubic-bezier(0.4, 0, 1, 1);",
  "ease-out": "transition-timing-function: cubic-bezier(0, 0, 0.2, 1);",
  "ease-in-out":
    "transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);",
  "shadow-none": "box-shadow: none;",
  "shadow-2xs": "box-shadow: 0 1px rgb(0 0 0 / 0.05);",
  "shadow-xs": "box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);",
  "shadow-sm":
    "box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);",
  "shadow-md":
    "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);",
  "shadow-lg":
    "box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);",
  "shadow-xl":
    "box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);",
  "shadow-2xl": "box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);",
  "shadow-inner": "box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);",
  ...fontSizes,
  ...gridTemplates,
  ...gridTemplateRows,
};

const cssEscape = (className: string) => {
  return className.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, "\\$&");
};

const extractClassNames = (html: string) => {
  const classNames = new Set<string>();
  const regex = /\bclass=(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const value = match[1] ?? match[2] ?? "";
    value
      .split(/\s+/)
      .filter(Boolean)
      .forEach((className) => classNames.add(className));
  }

  return Array.from(classNames);
};

const spacingValue = (value: string) => {
  if (value === "px") return "1px";
  if (value === "auto") return "auto";
  if (value === "full") return "100%";
  if (value === "screen") return "100vh";
  if (value === "min") return "min-content";
  if (value === "max") return "max-content";
  if (value === "fit") return "fit-content";
  if (/^\d+\/\d+$/.test(value)) {
    const [numerator, denominator] = value.split("/").map(Number);
    return `${(numerator / denominator) * 100}%`;
  }
  const number = Number(value);
  return Number.isNaN(number) ? "" : `${number / 4}rem`;
};

const maxWidthValues: { [value: string]: string } = {
  "0": "0px",
  xs: "20rem",
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
  "4xl": "56rem",
  "5xl": "64rem",
  "6xl": "72rem",
  "7xl": "80rem",
  none: "none",
  full: "100%",
  min: "min-content",
  max: "max-content",
  fit: "fit-content",
};

const sizeValue = (prefix: string, value: string) => {
  if (prefix === "max-w" && maxWidthValues[value]) return maxWidthValues[value];
  return spacingValue(value);
};

const transformDeclaration =
  "transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1));";

const arbitraryValue = (value: string) => {
  return value.replace(/\\,/g, ",").replace(/_/g, " ");
};

const isArbitraryColorValue = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  return (
    normalizedValue.startsWith("#") ||
    /^rgba?\(/.test(normalizedValue) ||
    /^hsla?\(/.test(normalizedValue) ||
    normalizedValue.startsWith("color(") ||
    normalizedValue.startsWith("oklab(") ||
    normalizedValue.startsWith("oklch(")
  );
};

const declarationsForUtility = (utility: string) => {
  if (staticUtilities[utility]) return staticUtilities[utility];

  const arbitrarySideBorderWidth = utility.match(
    /^border-([trbl])-\[(.+)\]$/
  );
  if (arbitrarySideBorderWidth) {
    const [, side, value] = arbitrarySideBorderWidth;
    const sides: { [side: string]: string } = {
      t: "top",
      r: "right",
      b: "bottom",
      l: "left",
    };
    return `border-${sides[side]}-width: ${arbitraryValue(value)};`;
  }

  const arbitraryMatch = utility.match(/^([a-z-]+)-\[(.+)\]$/);
  if (arbitraryMatch) {
    const [, prefix, value] = arbitraryMatch;
    const cssValue = arbitraryValue(value);
    const arbitraryProperties: { [prefix: string]: string } = {
      m: "margin",
      mt: "margin-top",
      mr: "margin-right",
      mb: "margin-bottom",
      ml: "margin-left",
      mx: "margin-inline",
      my: "margin-block",
      p: "padding",
      pt: "padding-top",
      pr: "padding-right",
      pb: "padding-bottom",
      pl: "padding-left",
      px: "padding-inline",
      py: "padding-block",
      w: "width",
      h: "height",
      "max-w": "max-width",
      "max-h": "max-height",
      "min-w": "min-width",
      "min-h": "min-height",
      gap: "gap",
      "gap-x": "column-gap",
      "gap-y": "row-gap",
      basis: "flex-basis",
      top: "top",
      right: "right",
      bottom: "bottom",
      left: "left",
      z: "z-index",
      opacity: "opacity",
      tracking: "letter-spacing",
      indent: "text-indent",
      text: isArbitraryColorValue(cssValue) ? "color" : "font-size",
      leading: "line-height",
      transition: "transition-property",
      duration: "transition-duration",
      delay: "transition-delay",
      ease: "transition-timing-function",
      rounded: "border-radius",
      shadow: "box-shadow",
      "grid-cols": "grid-template-columns",
      "grid-rows": "grid-template-rows",
      bg:
        cssValue.startsWith("url(") || cssValue.includes("gradient(")
          ? "background-image"
          : "background-color",
      border: "border-color",
    };
    const property = arbitraryProperties[prefix];
    return property ? `${property}: ${cssValue};` : "";
  }

  const spacingMatch = utility.match(
    /^(m|mx|my|mt|mr|mb|ml|p|px|py|pt|pr|pb|pl|w|h|min-w|min-h|max-w|max-h|basis|top|right|bottom|left|gap|gap-x|gap-y)-(.+)$/
  );
  if (spacingMatch) {
    const [, prefix, value] = spacingMatch;
    const cssValue = sizeValue(prefix, value);
    if (!cssValue) return "";
    const properties: { [prefix: string]: string[] } = {
      m: ["margin"],
      mx: ["margin-left", "margin-right"],
      my: ["margin-top", "margin-bottom"],
      mt: ["margin-top"],
      mr: ["margin-right"],
      mb: ["margin-bottom"],
      ml: ["margin-left"],
      p: ["padding"],
      px: ["padding-left", "padding-right"],
      py: ["padding-top", "padding-bottom"],
      pt: ["padding-top"],
      pr: ["padding-right"],
      pb: ["padding-bottom"],
      pl: ["padding-left"],
      w: ["width"],
      h: ["height"],
      "min-w": ["min-width"],
      "min-h": ["min-height"],
      "max-w": ["max-width"],
      "max-h": ["max-height"],
      basis: ["flex-basis"],
      top: ["top"],
      right: ["right"],
      bottom: ["bottom"],
      left: ["left"],
      gap: ["gap"],
      "gap-x": ["column-gap"],
      "gap-y": ["row-gap"],
    };
    return properties[prefix]
      .map((property) => `${property}: ${cssValue};`)
      .join("");
  }

  const sideBorderWidth = utility.match(/^border-([trbl])-(0|2|4|8)$/);
  if (sideBorderWidth) {
    const [, side, width] = sideBorderWidth;
    const sides: { [side: string]: string } = {
      t: "top",
      r: "right",
      b: "bottom",
      l: "left",
    };
    return `border-${sides[side]}-width: ${width}px;`;
  }

  const colorMatch = utility.match(
    /^(text|bg|border|border-t|border-r|border-b|border-l)-(.+)$/
  );
  if (colorMatch) {
    const [, prefix, color] = colorMatch;
    const cssColor = colorCodes[color];
    if (!cssColor) return "";
    const properties: { [prefix: string]: string } = {
      text: "color",
      bg: "background-color",
      border: "border-color",
      "border-t": "border-top-color",
      "border-r": "border-right-color",
      "border-b": "border-bottom-color",
      "border-l": "border-left-color",
    };
    return `${properties[prefix]}: ${cssColor};`;
  }

  const opacityMatch = utility.match(/^opacity-(\d+)$/);
  if (opacityMatch) return `opacity: ${Number(opacityMatch[1]) / 100};`;

  const translateMatch = utility.match(/^(-)?translate-([xy])-(.+)$/);
  if (translateMatch) {
    const [, negative, axis, value] = translateMatch;
    const cssValue = spacingValue(value);
    if (!cssValue) return "";
    return `--tw-translate-${axis}: ${negative ? "-" : ""}${cssValue};${transformDeclaration}`;
  }

  const rotateMatch = utility.match(/^(-)?rotate-(.+)$/);
  if (rotateMatch) {
    const [, negative, value] = rotateMatch;
    return `--tw-rotate: ${negative ? "-" : ""}${value}deg;${transformDeclaration}`;
  }

  const skewMatch = utility.match(/^(-)?skew-([xy])-(.+)$/);
  if (skewMatch) {
    const [, negative, axis, value] = skewMatch;
    return `--tw-skew-${axis}: ${negative ? "-" : ""}${value}deg;${transformDeclaration}`;
  }

  const scaleMatch = utility.match(/^scale(?:-([xy]))?-(\d+)$/);
  if (scaleMatch) {
    const [, axis, value] = scaleMatch;
    const scaleValue = String(Number(value) / 100);
    if (axis === "x") {
      return `--tw-scale-x: ${scaleValue};${transformDeclaration}`;
    }
    if (axis === "y") {
      return `--tw-scale-y: ${scaleValue};${transformDeclaration}`;
    }
    return `--tw-scale-x: ${scaleValue};--tw-scale-y: ${scaleValue};${transformDeclaration}`;
  }

  const zIndexMatch = utility.match(/^z-(auto|\d+)$/);
  if (zIndexMatch) return `z-index: ${zIndexMatch[1]};`;

  const orderMatch = utility.match(/^order-(first|last|none|\d+)$/);
  if (orderMatch) {
    const orderValues: { [value: string]: string } = {
      first: "-9999",
      last: "9999",
      none: "0",
    };
    return `order: ${orderValues[orderMatch[1]] ?? orderMatch[1]};`;
  }

  const cursorMatch = utility.match(/^cursor-(.+)$/);
  if (cursorMatch) return `cursor: ${cursorMatch[1]};`;

  const durationMatch = utility.match(/^(duration|delay)-(\d+)$/);
  if (durationMatch) {
    const [, prefix, value] = durationMatch;
    return `transition-${prefix === "duration" ? "duration" : "delay"}: ${value}ms;`;
  }

  return "";
};

const ruleForClassName = (className: string): UtilityRule | null => {
  const parts = className.split(":");
  const utility = parts.pop() ?? "";
  const declarations = declarationsForUtility(utility);
  if (!declarations) return null;

  let selector = `.${cssEscape(className)}`;
  let media = "";
  parts.forEach((variant) => {
    if (breakpoints[variant]) media = breakpoints[variant];
    if (pseudoVariants[variant]) selector += pseudoVariants[variant];
  });

  return { selector, declarations, media };
};

export const generatePreviewCss = (html: string) => {
  const rules = extractClassNames(html)
    .map(ruleForClassName)
    .filter((rule): rule is UtilityRule => Boolean(rule));
  const regularRules: string[] = [];
  const mediaRules = new Map<string, string[]>();

  rules.forEach((rule) => {
    const cssRule = `${rule.selector}{${rule.declarations}}`;
    if (rule.media) {
      mediaRules.set(rule.media, [...(mediaRules.get(rule.media) ?? []), cssRule]);
    } else {
      regularRules.push(cssRule);
    }
  });

  const responsiveRules = Array.from(mediaRules.entries()).map(
    ([media, mediaRule]) => `@media ${media}{${mediaRule.join("")}}`
  );

  return [...regularRules, ...responsiveRules].join("\n");
};
