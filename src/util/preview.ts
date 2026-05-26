import DOMPurify from "dompurify";
import { colorCodes } from "./colors";

type UtilityRule = {
  selector: string;
  declarations: string;
  media?: string;
};

const hasDocumentShell = (html: string) => /<\/?(html|head|body)\b/i.test(html);

export const sanitizePreviewHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script"],
    WHOLE_DOCUMENT: hasDocumentShell(html),
  });
};

export const sanitizePreviewCss = (css: string) => {
  return css.replace(/<\/style/gi, "<\\/style");
};

export const buildPreviewDoc = (html: string, css: string) => {
  const safeCss = sanitizePreviewCss(css);

  if (!hasDocumentShell(html)) {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${safeCss}</style>
</head>
<body>${html}</body>
</html>`;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  let viewport = doc.querySelector("meta[name='viewport']");
  if (!viewport) {
    viewport = doc.createElement("meta");
    viewport.setAttribute("name", "viewport");
    viewport.setAttribute("content", "width=device-width, initial-scale=1");
    doc.head.appendChild(viewport);
  }

  if (!doc.querySelector("meta[charset]")) {
    const charset = doc.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    doc.head.prepend(charset);
  }

  const style = doc.createElement("style");
  style.textContent = safeCss;
  const firstAuthoredStyle = doc.head.querySelector("style,link[rel='stylesheet']");
  if (firstAuthoredStyle) {
    doc.head.insertBefore(style, firstAuthoredStyle);
  } else {
    doc.head.appendChild(style);
  }

  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
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

const colorKeywordValues: { [color: string]: string } = {
  current: "currentColor",
  inherit: "inherit",
  transparent: "transparent",
};

const colorValue = (color: string) => colorKeywordValues[color] ?? colorCodes[color];

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
const gridColumnSpans = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const count = index + 1;
    return [`col-span-${count}`, `grid-column: span ${count} / span ${count};`];
  })
);
const gridRowSpans = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const count = index + 1;
    return [`row-span-${count}`, `grid-row: span ${count} / span ${count};`];
  })
);
const gridLineUtilities = Object.fromEntries(
  ["col-start", "col-end", "row-start", "row-end"].flatMap((prefix) =>
    Array.from({ length: 13 }, (_, index) => {
      const line = index + 1;
      const property = prefix
        .replace("col", "grid-column")
        .replace("row", "grid-row");
      return [`${prefix}-${line}`, `${property}: ${line};`];
    })
  )
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
  "flex-wrap-reverse": "flex-wrap: wrap-reverse;",
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
  "justify-items-start": "justify-items: start;",
  "justify-items-end": "justify-items: end;",
  "justify-items-center": "justify-items: center;",
  "justify-items-stretch": "justify-items: stretch;",
  "justify-self-auto": "justify-self: auto;",
  "justify-self-start": "justify-self: start;",
  "justify-self-end": "justify-self: end;",
  "justify-self-center": "justify-self: center;",
  "justify-self-stretch": "justify-self: stretch;",
  "content-center": "align-content: center;",
  "content-start": "align-content: flex-start;",
  "content-end": "align-content: flex-end;",
  "content-between": "align-content: space-between;",
  "content-around": "align-content: space-around;",
  "content-evenly": "align-content: space-evenly;",
  "self-auto": "align-self: auto;",
  "self-start": "align-self: flex-start;",
  "self-end": "align-self: flex-end;",
  "self-center": "align-self: center;",
  "self-stretch": "align-self: stretch;",
  "self-baseline": "align-self: baseline;",
  "items-start": "align-items: flex-start;",
  "items-end": "align-items: flex-end;",
  "items-center": "align-items: center;",
  "items-baseline": "align-items: baseline;",
  "items-stretch": "align-items: stretch;",
  "place-content-center": "place-content: center;",
  "place-content-start": "place-content: start;",
  "place-content-end": "place-content: end;",
  "place-content-between": "place-content: space-between;",
  "place-content-around": "place-content: space-around;",
  "place-content-evenly": "place-content: space-evenly;",
  "place-content-stretch": "place-content: stretch;",
  "place-items-start": "place-items: start;",
  "place-items-end": "place-items: end;",
  "place-items-center": "place-items: center;",
  "place-items-stretch": "place-items: stretch;",
  "place-self-auto": "place-self: auto;",
  "place-self-start": "place-self: start;",
  "place-self-end": "place-self: end;",
  "place-self-center": "place-self: center;",
  "place-self-stretch": "place-self: stretch;",
  "float-right": "float: right;",
  "float-left": "float: left;",
  "float-none": "float: none;",
  "clear-left": "clear: left;",
  "clear-right": "clear: right;",
  "clear-both": "clear: both;",
  "clear-none": "clear: none;",
  isolate: "isolation: isolate;",
  "isolation-auto": "isolation: auto;",
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
  "decoration-solid": "text-decoration-style: solid;",
  "decoration-double": "text-decoration-style: double;",
  "decoration-dotted": "text-decoration-style: dotted;",
  "decoration-dashed": "text-decoration-style: dashed;",
  "decoration-wavy": "text-decoration-style: wavy;",
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
  "border-hidden": "border-style: hidden;",
  "border-none": "border-style: none;",
  outline: "outline-style: solid;",
  "outline-dashed": "outline-style: dashed;",
  "outline-dotted": "outline-style: dotted;",
  "outline-double": "outline-style: double;",
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
  "object-bottom": "object-position: bottom;",
  "object-center": "object-position: center;",
  "object-left": "object-position: left;",
  "object-left-bottom": "object-position: left bottom;",
  "object-left-top": "object-position: left top;",
  "object-right": "object-position: right;",
  "object-right-bottom": "object-position: right bottom;",
  "object-right-top": "object-position: right top;",
  "object-top": "object-position: top;",
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
  "overscroll-auto": "overscroll-behavior: auto;",
  "overscroll-contain": "overscroll-behavior: contain;",
  "overscroll-none": "overscroll-behavior: none;",
  "overscroll-x-auto": "overscroll-behavior-x: auto;",
  "overscroll-x-contain": "overscroll-behavior-x: contain;",
  "overscroll-x-none": "overscroll-behavior-x: none;",
  "overscroll-y-auto": "overscroll-behavior-y: auto;",
  "overscroll-y-contain": "overscroll-behavior-y: contain;",
  "overscroll-y-none": "overscroll-behavior-y: none;",
  "scroll-auto": "scroll-behavior: auto;",
  "scroll-smooth": "scroll-behavior: smooth;",
  "snap-none": "scroll-snap-type: none;",
  "snap-start": "scroll-snap-align: start;",
  "snap-end": "scroll-snap-align: end;",
  "snap-center": "scroll-snap-align: center;",
  "snap-align-none": "scroll-snap-align: none;",
  "snap-normal": "scroll-snap-stop: normal;",
  "snap-always": "scroll-snap-stop: always;",
  "touch-auto": "touch-action: auto;",
  "touch-none": "touch-action: none;",
  "touch-pan-x": "touch-action: pan-x;",
  "touch-pan-left": "touch-action: pan-left;",
  "touch-pan-right": "touch-action: pan-right;",
  "touch-pan-y": "touch-action: pan-y;",
  "touch-pan-up": "touch-action: pan-up;",
  "touch-pan-down": "touch-action: pan-down;",
  "touch-pinch-zoom": "touch-action: pinch-zoom;",
  "touch-manipulation": "touch-action: manipulation;",
  "will-change-auto": "will-change: auto;",
  "will-change-scroll": "will-change: scroll-position;",
  "will-change-contents": "will-change: contents;",
  "will-change-transform": "will-change: transform;",
  "border-collapse": "border-collapse: collapse;",
  "border-separate": "border-collapse: separate;",
  "table-auto": "table-layout: auto;",
  "table-fixed": "table-layout: fixed;",
  "stroke-0": "stroke-width: 0;",
  "stroke-1": "stroke-width: 1;",
  "stroke-2": "stroke-width: 2;",
  "grid-cols-none": "grid-template-columns: none;",
  "grid-cols-subgrid": "grid-template-columns: subgrid;",
  "grid-rows-none": "grid-template-rows: none;",
  "grid-rows-subgrid": "grid-template-rows: subgrid;",
  "col-auto": "grid-column: auto;",
  "row-auto": "grid-row: auto;",
  "col-span-full": "grid-column: 1 / -1;",
  "row-span-full": "grid-row: 1 / -1;",
  "col-start-auto": "grid-column-start: auto;",
  "col-end-auto": "grid-column-end: auto;",
  "row-start-auto": "grid-row-start: auto;",
  "row-end-auto": "grid-row-end: auto;",
  "auto-rows-auto": "grid-auto-rows: auto;",
  "auto-rows-min": "grid-auto-rows: min-content;",
  "auto-rows-max": "grid-auto-rows: max-content;",
  "auto-rows-fr": "grid-auto-rows: minmax(0, 1fr);",
  "auto-cols-auto": "grid-auto-columns: auto;",
  "auto-cols-min": "grid-auto-columns: min-content;",
  "auto-cols-max": "grid-auto-columns: max-content;",
  "auto-cols-fr": "grid-auto-columns: minmax(0, 1fr);",
  "grid-flow-row": "grid-auto-flow: row;",
  "grid-flow-col": "grid-auto-flow: column;",
  "grid-flow-dense": "grid-auto-flow: dense;",
  "grid-flow-row-dense": "grid-auto-flow: row dense;",
  "grid-flow-col-dense": "grid-auto-flow: column dense;",
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
  "bg-fixed": "background-attachment: fixed;",
  "bg-local": "background-attachment: local;",
  "bg-scroll": "background-attachment: scroll;",
  "bg-clip-border": "background-clip: border-box;",
  "bg-clip-padding": "background-clip: padding-box;",
  "bg-clip-content": "background-clip: content-box;",
  "bg-clip-text": "background-clip: text;",
  "bg-origin-border": "background-origin: border-box;",
  "bg-origin-padding": "background-origin: padding-box;",
  "bg-origin-content": "background-origin: content-box;",
  "bg-bottom": "background-position: bottom;",
  "bg-center": "background-position: center;",
  "bg-left": "background-position: left;",
  "bg-left-bottom": "background-position: left bottom;",
  "bg-left-top": "background-position: left top;",
  "bg-right": "background-position: right;",
  "bg-right-bottom": "background-position: right bottom;",
  "bg-right-top": "background-position: right top;",
  "bg-top": "background-position: top;",
  "bg-repeat": "background-repeat: repeat;",
  "bg-no-repeat": "background-repeat: no-repeat;",
  "bg-repeat-x": "background-repeat: repeat-x;",
  "bg-repeat-y": "background-repeat: repeat-y;",
  "bg-repeat-round": "background-repeat: round;",
  "bg-repeat-space": "background-repeat: space;",
  "bg-auto": "background-size: auto;",
  "bg-cover": "background-size: cover;",
  "bg-contain": "background-size: contain;",
  "bg-linear-to-t":
    "background-image: linear-gradient(to top, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "bg-linear-to-tr":
    "background-image: linear-gradient(to top right, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "bg-linear-to-r":
    "background-image: linear-gradient(to right, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "bg-linear-to-br":
    "background-image: linear-gradient(to bottom right, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "bg-linear-to-b":
    "background-image: linear-gradient(to bottom, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "bg-linear-to-bl":
    "background-image: linear-gradient(to bottom left, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "bg-linear-to-l":
    "background-image: linear-gradient(to left, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "bg-linear-to-tl":
    "background-image: linear-gradient(to top left, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));",
  "origin-center": "transform-origin: center;",
  "origin-top": "transform-origin: top;",
  "origin-top-right": "transform-origin: top right;",
  "origin-right": "transform-origin: right;",
  "origin-bottom-right": "transform-origin: bottom right;",
  "origin-bottom": "transform-origin: bottom;",
  "origin-bottom-left": "transform-origin: bottom left;",
  "origin-left": "transform-origin: left;",
  "origin-top-left": "transform-origin: top left;",
  "mix-blend-normal": "mix-blend-mode: normal;",
  "mix-blend-multiply": "mix-blend-mode: multiply;",
  "mix-blend-screen": "mix-blend-mode: screen;",
  "mix-blend-overlay": "mix-blend-mode: overlay;",
  "mix-blend-darken": "mix-blend-mode: darken;",
  "mix-blend-lighten": "mix-blend-mode: lighten;",
  "mix-blend-color-dodge": "mix-blend-mode: color-dodge;",
  "mix-blend-color-burn": "mix-blend-mode: color-burn;",
  "mix-blend-hard-light": "mix-blend-mode: hard-light;",
  "mix-blend-soft-light": "mix-blend-mode: soft-light;",
  "mix-blend-difference": "mix-blend-mode: difference;",
  "mix-blend-exclusion": "mix-blend-mode: exclusion;",
  "mix-blend-hue": "mix-blend-mode: hue;",
  "mix-blend-saturation": "mix-blend-mode: saturation;",
  "mix-blend-color": "mix-blend-mode: color;",
  "mix-blend-luminosity": "mix-blend-mode: luminosity;",
  "mix-blend-plus-lighter": "mix-blend-mode: plus-lighter;",
  "bg-blend-normal": "background-blend-mode: normal;",
  "bg-blend-multiply": "background-blend-mode: multiply;",
  "bg-blend-screen": "background-blend-mode: screen;",
  "bg-blend-overlay": "background-blend-mode: overlay;",
  "bg-blend-darken": "background-blend-mode: darken;",
  "bg-blend-lighten": "background-blend-mode: lighten;",
  "bg-blend-color-dodge": "background-blend-mode: color-dodge;",
  "bg-blend-color-burn": "background-blend-mode: color-burn;",
  "bg-blend-hard-light": "background-blend-mode: hard-light;",
  "bg-blend-soft-light": "background-blend-mode: soft-light;",
  "bg-blend-difference": "background-blend-mode: difference;",
  "bg-blend-exclusion": "background-blend-mode: exclusion;",
  "bg-blend-hue": "background-blend-mode: hue;",
  "bg-blend-saturation": "background-blend-mode: saturation;",
  "bg-blend-color": "background-blend-mode: color;",
  "bg-blend-luminosity": "background-blend-mode: luminosity;",
  ...fontSizes,
  ...gridTemplates,
  ...gridTemplateRows,
  ...gridColumnSpans,
  ...gridRowSpans,
  ...gridLineUtilities,
};

const cssEscape = (className: string) => {
  return className.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, "\\$&");
};

const previewPreflightCss =
  "*,::before,::after{border-width:0;border-style:solid;}";

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
  if (
    ["outline", "outline-offset", "decoration", "underline-offset"].includes(
      prefix
    ) &&
    /^(0|1|2|4|8)$/.test(value)
  ) {
    return `${value}px`;
  }
  return spacingValue(value);
};

const transformDeclaration =
  "transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0)) rotate(var(--tw-rotate, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1));";

const filterDeclaration =
  "filter: blur(var(--tw-blur, 0)) brightness(var(--tw-brightness, 1)) contrast(var(--tw-contrast, 1)) grayscale(var(--tw-grayscale, 0)) hue-rotate(var(--tw-hue-rotate, 0)) invert(var(--tw-invert, 0)) opacity(var(--tw-filter-opacity, 1)) saturate(var(--tw-saturate, 1)) sepia(var(--tw-sepia, 0));";

const backdropFilterDeclaration =
  "backdrop-filter: blur(var(--tw-backdrop-blur, 0)) brightness(var(--tw-backdrop-brightness, 1)) contrast(var(--tw-backdrop-contrast, 1)) grayscale(var(--tw-backdrop-grayscale, 0)) hue-rotate(var(--tw-backdrop-hue-rotate, 0)) invert(var(--tw-backdrop-invert, 0)) opacity(var(--tw-backdrop-opacity, 1)) saturate(var(--tw-backdrop-saturate, 1)) sepia(var(--tw-backdrop-sepia, 0));";

const blurValues: { [value: string]: string } = {
  none: "0",
  sm: "4px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "40px",
  "3xl": "64px",
};

const arbitraryValue = (value: string) => {
  return value.replace(/\\,/g, ",").replace(/_/g, " ");
};

const arbitraryValueParts = (value: string) => {
  const cssValue = arbitraryValue(value);
  const typeHintMatch = cssValue.match(/^([a-z-]+):(.+)$/);

  return {
    cssValue: typeHintMatch ? typeHintMatch[2] : cssValue,
    typeHint: typeHintMatch?.[1] ?? "",
  };
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

const filterAmount = (value: string) => String(Number(value) / 100);

const declarationsForFilterUtility = (utility: string) => {
  const isBackdrop = utility.startsWith("backdrop-");
  const prefix = isBackdrop ? "backdrop-" : "";
  const filterPropertyPrefix = isBackdrop ? "--tw-backdrop-" : "--tw-";
  const declaration = isBackdrop ? backdropFilterDeclaration : filterDeclaration;
  const normalizedUtility = isBackdrop
    ? utility.replace("backdrop-", "")
    : utility;

  const blurMatch = normalizedUtility.match(/^blur(?:-(none|sm|md|lg|xl|2xl|3xl))?$/);
  if (blurMatch) {
    const value = blurMatch[1] ? blurValues[blurMatch[1]] : "8px";
    return `${filterPropertyPrefix}blur: ${value};${declaration}`;
  }

  for (const name of ["brightness", "contrast", "saturate"] as const) {
    const match = normalizedUtility.match(new RegExp(`^${name}-(\\d+)$`));
    if (match) {
      return `${filterPropertyPrefix}${name}: ${filterAmount(match[1])};${declaration}`;
    }
  }

  const opacityMatch = normalizedUtility.match(/^opacity-(\d+)$/);
  if (opacityMatch && isBackdrop) {
    return `${filterPropertyPrefix}opacity: ${filterAmount(opacityMatch[1])};${declaration}`;
  }

  const hueRotateMatch = normalizedUtility.match(/^(-)?hue-rotate-(\d+)$/);
  if (hueRotateMatch) {
    const [, negative, value] = hueRotateMatch;
    return `${filterPropertyPrefix}hue-rotate: ${negative ? "-" : ""}${value}deg;${declaration}`;
  }

  for (const name of ["grayscale", "invert", "sepia"] as const) {
    if (normalizedUtility === name) {
      return `${filterPropertyPrefix}${name}: 1;${declaration}`;
    }
    if (normalizedUtility === `${name}-0`) {
      return `${filterPropertyPrefix}${name}: 0;${declaration}`;
    }
  }

  return prefix ? "" : "";
};

const declarationsForGradientStopUtility = (utility: string) => {
  const match = utility.match(/^(from|via|to)-(.+)$/);
  if (!match) return "";

  const [, prefix, color] = match;
  const arbitraryColor = color.match(/^\[(.+)\]$/);
  const cssColor = arbitraryColor
    ? arbitraryValueParts(arbitraryColor[1]).cssValue
    : colorValue(color);
  if (!cssColor) return "";

  if (prefix === "from") {
    return `--tw-gradient-from: ${cssColor};--tw-gradient-to: transparent;--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);`;
  }
  if (prefix === "via") {
    return `--tw-gradient-stops: var(--tw-gradient-from), ${cssColor}, var(--tw-gradient-to);`;
  }
  return `--tw-gradient-to: ${cssColor};`;
};

const declarationsForUtility = (utility: string) => {
  if (staticUtilities[utility]) return staticUtilities[utility];

  const gradientStopUtility = declarationsForGradientStopUtility(utility);
  if (gradientStopUtility) return gradientStopUtility;

  const negativeTrackingMatch = utility.match(
    /^-tracking-(tighter|tight|normal|wide|wider|widest)$/
  );
  if (negativeTrackingMatch) {
    const trackingValues: { [value: string]: string } = {
      tighter: "0.05em",
      tight: "0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    };
    return `letter-spacing: -${trackingValues[negativeTrackingMatch[1]]};`;
  }

  const arbitrarySideBorderWidth = utility.match(
    /^border-([trbl])-\[(.+)\]$/
  );
  if (arbitrarySideBorderWidth) {
    const [, side, value] = arbitrarySideBorderWidth;
    const { cssValue, typeHint } = arbitraryValueParts(value);
    const sides: { [side: string]: string } = {
      t: "top",
      r: "right",
      b: "bottom",
      l: "left",
    };
    const property =
      typeHint === "color" || isArbitraryColorValue(cssValue) ? "color" : "width";

    return `border-${sides[side]}-${property}: ${cssValue};`;
  }

  const arbitraryMatch = utility.match(/^([a-z-]+)-\[(.+)\]$/);
  if (arbitraryMatch) {
    const [, prefix, value] = arbitraryMatch;
    const { cssValue, typeHint } = arbitraryValueParts(value);
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
      text:
        typeHint === "color" || isArbitraryColorValue(cssValue)
          ? "color"
          : "font-size",
      leading: "line-height",
      transition: "transition-property",
      duration: "transition-duration",
      delay: "transition-delay",
      ease: "transition-timing-function",
      rounded: "border-radius",
      shadow: "box-shadow",
      "grid-cols": "grid-template-columns",
      "grid-rows": "grid-template-rows",
      col: "grid-column",
      row: "grid-row",
      "col-start": "grid-column-start",
      "col-end": "grid-column-end",
      "row-start": "grid-row-start",
      "row-end": "grid-row-end",
      bg:
        typeHint !== "color" &&
        (cssValue.startsWith("url(") || cssValue.includes("gradient("))
          ? "background-image"
          : "background-color",
      border: "border-color",
      "border-t": "border-top-color",
      "border-r": "border-right-color",
      "border-b": "border-bottom-color",
      "border-l": "border-left-color",
      decoration: "text-decoration-color",
      outline: "outline-color",
      "outline-offset": "outline-offset",
      accent: "accent-color",
      caret: "caret-color",
      fill: "fill",
      stroke: "stroke",
      columns: "columns",
      "scroll-m": "scroll-margin",
      "scroll-mt": "scroll-margin-top",
      "scroll-mr": "scroll-margin-right",
      "scroll-mb": "scroll-margin-bottom",
      "scroll-ml": "scroll-margin-left",
      "scroll-p": "scroll-padding",
      "scroll-pt": "scroll-padding-top",
      "scroll-pr": "scroll-padding-right",
      "scroll-pb": "scroll-padding-bottom",
      "scroll-pl": "scroll-padding-left",
      "underline-offset": "text-underline-offset",
    };
    const property = arbitraryProperties[prefix];
    return property ? `${property}: ${cssValue};` : "";
  }

  const spacingMatch = utility.match(
    /^(-)?(min-w|min-h|max-w|max-h|gap-x|gap-y|scroll-mt|scroll-mr|scroll-mb|scroll-ml|scroll-m|scroll-pt|scroll-pr|scroll-pb|scroll-pl|scroll-p|outline-offset|underline-offset|decoration|outline|basis|top|right|bottom|left|mx|my|mt|mr|mb|ml|px|py|pt|pr|pb|pl|m|p|w|h|gap)-(.+)$/
  );
  if (spacingMatch) {
    const [, negative, prefix, value] = spacingMatch;
    const cssValue = sizeValue(prefix, value);
    if (cssValue) {
      const signedCssValue =
        negative && !["0rem", "0px"].includes(cssValue)
          ? `-${cssValue}`
          : cssValue;
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
        "scroll-m": ["scroll-margin"],
        "scroll-mt": ["scroll-margin-top"],
        "scroll-mr": ["scroll-margin-right"],
        "scroll-mb": ["scroll-margin-bottom"],
        "scroll-ml": ["scroll-margin-left"],
        "scroll-p": ["scroll-padding"],
        "scroll-pt": ["scroll-padding-top"],
        "scroll-pr": ["scroll-padding-right"],
        "scroll-pb": ["scroll-padding-bottom"],
        "scroll-pl": ["scroll-padding-left"],
        outline: ["outline-width"],
        "outline-offset": ["outline-offset"],
        decoration: ["text-decoration-thickness"],
        "underline-offset": ["text-underline-offset"],
      };
      return properties[prefix]
        .map((property) => `${property}: ${signedCssValue};`)
        .join("");
    }
  }

  const columnsMatch = utility.match(/^columns-(auto|\d+|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)$/);
  if (columnsMatch) {
    const value = columnsMatch[1];
    const columnValues: { [value: string]: string } = {
      "3xs": "16rem",
      "2xs": "18rem",
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
    };
    return `columns: ${columnValues[value] ?? value};`;
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
    /^(text|bg|border-t|border-r|border-b|border-l|border|decoration|outline|accent|caret|fill|stroke)-(.+)$/
  );
  if (colorMatch) {
    const [, prefix, color] = colorMatch;
    const cssColor = colorValue(color);
    if (!cssColor) return "";
    const properties: { [prefix: string]: string } = {
      text: "color",
      bg: "background-color",
      border: "border-color",
      "border-t": "border-top-color",
      "border-r": "border-right-color",
      "border-b": "border-bottom-color",
      "border-l": "border-left-color",
      decoration: "text-decoration-color",
      outline: "outline-color",
      accent: "accent-color",
      caret: "caret-color",
      fill: "fill",
      stroke: "stroke",
    };
    return `${properties[prefix]}: ${cssColor};`;
  }

  const opacityMatch = utility.match(/^opacity-(\d+)$/);
  if (opacityMatch) return `opacity: ${Number(opacityMatch[1]) / 100};`;

  const leadingMatch = utility.match(/^leading-(\d+)$/);
  if (leadingMatch) return `line-height: ${Number(leadingMatch[1]) / 4}rem;`;

  const filterUtility = declarationsForFilterUtility(utility);
  if (filterUtility) return filterUtility;

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

const splitVariantParts = (className: string) => {
  const parts: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (const character of className) {
    if (character === "[") bracketDepth += 1;
    if (character === "]") bracketDepth = Math.max(0, bracketDepth - 1);

    if (character === ":" && bracketDepth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  parts.push(current);
  return parts;
};

const ruleForClassName = (className: string): UtilityRule | null => {
  const parts = splitVariantParts(className);
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

  return [previewPreflightCss, ...regularRules, ...responsiveRules].join("\n");
};
