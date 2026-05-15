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
  "text-left": "text-align: left;",
  "text-center": "text-align: center;",
  "text-right": "text-align: right;",
  "text-justify": "text-align: justify;",
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
  border: "border-width: 1px;",
  "border-0": "border-width: 0;",
  "border-2": "border-width: 2px;",
  "border-4": "border-width: 4px;",
  "border-8": "border-width: 8px;",
  "border-solid": "border-style: solid;",
  "border-dashed": "border-style: dashed;",
  "border-dotted": "border-style: dotted;",
  "border-double": "border-style: double;",
  "border-none": "border-style: none;",
  ...fontSizes,
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
  if (/^\d+\/\d+$/.test(value)) {
    const [numerator, denominator] = value.split("/").map(Number);
    return `${(numerator / denominator) * 100}%`;
  }
  const number = Number(value);
  return Number.isNaN(number) ? "" : `${number / 4}rem`;
};

const arbitraryValue = (value: string) => {
  return value.replace(/\\,/g, ",").replace(/_/g, " ");
};

const declarationsForUtility = (utility: string) => {
  if (staticUtilities[utility]) return staticUtilities[utility];

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
      p: "padding",
      pt: "padding-top",
      pr: "padding-right",
      pb: "padding-bottom",
      pl: "padding-left",
      w: "width",
      h: "height",
      "max-w": "max-width",
      "max-h": "max-height",
      text: "font-size",
      leading: "line-height",
      rounded: "border-radius",
      bg: "background-color",
      border: "border-color",
    };
    const property = arbitraryProperties[prefix];
    return property ? `${property}: ${cssValue};` : "";
  }

  const spacingMatch = utility.match(
    /^(m|mt|mr|mb|ml|p|pt|pr|pb|pl|w|h|max-w|max-h|gap|gap-x|gap-y)-(.+)$/
  );
  if (spacingMatch) {
    const [, prefix, value] = spacingMatch;
    const cssValue = spacingValue(value);
    if (!cssValue) return "";
    const properties: { [prefix: string]: string[] } = {
      m: ["margin"],
      mt: ["margin-top"],
      mr: ["margin-right"],
      mb: ["margin-bottom"],
      ml: ["margin-left"],
      p: ["padding"],
      pt: ["padding-top"],
      pr: ["padding-right"],
      pb: ["padding-bottom"],
      pl: ["padding-left"],
      w: ["width"],
      h: ["height"],
      "max-w": ["max-width"],
      "max-h": ["max-height"],
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
