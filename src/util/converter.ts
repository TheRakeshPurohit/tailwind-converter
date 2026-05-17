import {
  duration,
  opacity,
  borderValues,
  zIndex,
  letterSpacing,
  spacingValues,
  sizes,
  spacing,
  percentages,
  spacingCustom,
  fontSize,
  fontWeight,
  mainDict,
  columnSizes,
  colorDict,
  lineHeight,
  rotate,
  skew,
  scale,
  translate,
  blur,
  brightness,
  contrast,
  hueRotate,
  saturate,
  borderRadius,
  maxWidth
} from "./styles";

import { get } from "lodash";
import { getClosestValue, validValue } from "./helper";
import { colorCodes } from "./colors";
// @ts-expect-error no types
import NearestColor from "nearest-color";

export type ConversionMode = "tokens" | "exact";

export type DeclarationStatus = "converted" | "approximated" | "unsupported";

export type DeclarationConversion = {
  selector?: string;
  property: string;
  value: string;
  className: string;
  status: DeclarationStatus;
  message?: string;
};

type ConversionOptions = {
  mode?: ConversionMode;
};

const spacingPrefixes: { [index: string]: string } = {
  margin: "m",
  "margin-top": "mt",
  "margin-right": "mr",
  "margin-bottom": "mb",
  "margin-left": "ml",
  padding: "p",
  "padding-top": "pt",
  "padding-right": "pr",
  "padding-bottom": "pb",
  "padding-left": "pl",
  width: "w",
  height: "h",
  gap: "gap",
  "column-gap": "gap-x",
  "row-gap": "gap-y",
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  "flex-basis": "basis",
  "max-height": "max-h"
};

const colorPrefixes: { [index: string]: string } = {
  color: "text",
  "background-color": "bg",
  "border-color": "border",
  "text-decoration-color": "decoration",
  "outline-color": "outline",
  "accent-color": "accent",
  "caret-color": "caret",
  fill: "fill",
  stroke: "stroke"
};

const arbitraryValue = (value: string) =>
  value.trim().replace(/\s+/g, "_").replace(/,/g, "\\,");

const splitCssValue = (value: string) => value.trim().split(/\s+/).filter(Boolean);

const exactClassFor = (property: string, value: string) => {
  if (spacingPrefixes[property]) {
    return `${spacingPrefixes[property]}-[${arbitraryValue(value)}]`;
  }
  if (property === "font-size") return `text-[${arbitraryValue(value)}]`;
  if (property === "line-height") return `leading-[${arbitraryValue(value)}]`;
  if (property === "letter-spacing") {
    return `tracking-[${arbitraryValue(value)}]`;
  }
  if (property === "text-indent") return `indent-[${arbitraryValue(value)}]`;
  if (property === "border-radius") {
    return `rounded-[${arbitraryValue(value)}]`;
  }
  if (property.includes("border") && property.includes("width")) {
    let prefix = "border";
    if (property.includes("top")) prefix += "-t";
    if (property.includes("bottom")) prefix += "-b";
    if (property.includes("left")) prefix += "-l";
    if (property.includes("right")) prefix += "-r";
    return `${prefix}-[${arbitraryValue(value)}]`;
  }
  if (colorPrefixes[property]) {
    return `${colorPrefixes[property]}-[${arbitraryValue(value)}]`;
  }
  if (property === "background-image") {
    return `bg-[${arbitraryValue(value)}]`;
  }
  if (property === "opacity") return `opacity-[${arbitraryValue(value)}]`;
  if (property === "z-index") return `z-[${arbitraryValue(value)}]`;
  if (property === "transition-duration") {
    return `duration-[${arbitraryValue(value)}]`;
  }
  if (property === "transition-delay") {
    return `delay-[${arbitraryValue(value)}]`;
  }
  if (property === "transition-property") {
    return `transition-[${arbitraryValue(value)}]`;
  }
  if (property === "transition-timing-function") {
    return `ease-[${arbitraryValue(value)}]`;
  }
  if (property === "box-shadow") {
    return `shadow-[${arbitraryValue(value)}]`;
  }
  if (property === "grid-template-columns") {
    return `grid-cols-[${arbitraryValue(value)}]`;
  }
  if (property === "grid-template-rows") {
    return `grid-rows-[${arbitraryValue(value)}]`;
  }
  return "";
};

const gridTemplateClassFor = (property: string, value: string) => {
  const prefix =
    property === "grid-template-columns" ? "grid-cols" : "grid-rows";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");

  if (normalized === "none") return `${prefix}-none`;
  if (normalized === "subgrid") return `${prefix}-subgrid`;

  const repeatMatch = normalized.match(
    /^repeat\(\s*(\d+)\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)$/
  );
  if (repeatMatch) {
    const count = Number(repeatMatch[1]);
    if (count >= 1 && count <= 12) return `${prefix}-${count}`;
  }

  const repeatFrMatch = normalized.match(/^repeat\(\s*(\d+)\s*,\s*1fr\s*\)$/);
  if (repeatFrMatch) {
    const count = Number(repeatFrMatch[1]);
    if (count >= 1 && count <= 12) return `${prefix}-${count}`;
  }

  return "";
};

const normalizeTransitionProperty = (value: string) =>
  value
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join(", ");

const transitionPropertyClassFor = (value: string) => {
  const normalized = normalizeTransitionProperty(value);
  const colorProperties = [
    "background-color",
    "border-color",
    "color",
    "fill",
    "outline-color",
    "stroke",
    "text-decoration-color",
  ];

  if (normalized === "none") return "transition-none";
  if (normalized === "all") return "transition-all";
  if (normalized === "opacity") return "transition-opacity";
  if (normalized === "box-shadow") return "transition-shadow";
  if (normalized === "transform") return "transition-transform";
  if (
    normalized === colorProperties.slice().sort().join(", ") ||
    normalized
      .split(", ")
      .every((property) => colorProperties.includes(property))
  ) {
    return "transition-colors";
  }

  return "";
};

const transitionTimingClassFor = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  const timingMap: { [value: string]: string } = {
    linear: "ease-linear",
    "ease-in": "ease-in",
    "cubic-bezier(0.4, 0, 1, 1)": "ease-in",
    "ease-out": "ease-out",
    "cubic-bezier(0, 0, 0.2, 1)": "ease-out",
    "ease-in-out": "ease-in-out",
    "cubic-bezier(0.4, 0, 0.2, 1)": "ease-in-out",
  };

  return timingMap[normalized] ?? "";
};

type ShadowToken = {
  className: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  inset?: boolean;
};

const shadowTokens: ShadowToken[] = [
  { className: "shadow-2xs", x: 0, y: 1, blur: 0, spread: 0 },
  { className: "shadow-xs", x: 0, y: 1, blur: 2, spread: 0 },
  { className: "shadow-sm", x: 0, y: 1, blur: 3, spread: 0 },
  { className: "shadow-md", x: 0, y: 4, blur: 6, spread: -1 },
  { className: "shadow-lg", x: 0, y: 10, blur: 15, spread: -3 },
  { className: "shadow-xl", x: 0, y: 20, blur: 25, spread: -5 },
  { className: "shadow-2xl", x: 0, y: 25, blur: 50, spread: -12 },
  { className: "shadow-inner", x: 0, y: 2, blur: 4, spread: 0, inset: true },
];

const splitShadowLayers = (value: string) => {
  const layers: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "(") depth += 1;
    if (character === ")") depth = Math.max(0, depth - 1);
    if (character === "," && depth === 0) {
      layers.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  layers.push(value.slice(start).trim());
  return layers.filter(Boolean);
};

const parseShadowLengths = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const inset = /\binset\b/.test(normalized);
  const tokens = normalized
    .replace(/\binset\b/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const lengths: number[] = [];

  for (const token of tokens) {
    if (/^-?\d*\.?\d+px$/.test(token)) {
      lengths.push(Number(token.replace("px", "")));
    } else if (/^-?\d*\.?\d+rem$/.test(token)) {
      lengths.push(Number(token.replace("rem", "")) * 16);
    } else if (token === "0" || token === "-0") {
      lengths.push(0);
    } else if (lengths.length >= 2) {
      break;
    }

    if (lengths.length === 4) break;
  }

  if (lengths.length < 2) return null;

  return {
    x: lengths[0],
    y: lengths[1],
    blur: lengths[2] ?? 0,
    spread: lengths[3] ?? 0,
    inset,
  };
};

const shadowClassFor = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "none") return "shadow-none";

  const firstLayer = splitShadowLayers(normalized)[0];
  const shadow = parseShadowLengths(firstLayer);
  if (!shadow) return "";

  const candidates = shadowTokens.filter(
    (token) => Boolean(token.inset) === shadow.inset
  );
  const nearest = candidates.reduce(
    (closest, token) => {
      const score =
        Math.abs(token.x - shadow.x) +
        Math.abs(token.y - shadow.y) +
        Math.abs(token.blur - shadow.blur) +
        Math.abs(token.spread - shadow.spread);

      return score < closest.score ? { token, score } : closest;
    },
    { token: candidates[0], score: Number.POSITIVE_INFINITY }
  );

  return nearest.token?.className ?? "";
};

export const convertAttributesDetailed = (
  attributes: { [index: string]: string },
  options: ConversionOptions = {}
) => {
  const mode = options.mode ?? "tokens";
  const result: DeclarationConversion[] = [];
  let style: string;
  for (style in attributes) {
    let negativeValue: boolean = false;
    let styleValue: string = attributes[style];
    const originalValue = String(styleValue);
    let styleNumber: number;
    // TODO Refactor this bc there can be multiple filters
    if (Array.isArray(styleValue)) styleValue = styleValue[0];
    if (typeof styleValue === "string") {
      styleValue = styleValue.toLowerCase();
      styleNumber = parseFloat(styleValue.replace(/[^-.\d]/g, ""));
    } else {
      styleNumber = styleValue;
    }
    if (styleNumber < 0) {
      styleNumber = Math.abs(styleNumber);
      negativeValue = true;
    }
    let tailwindValue: string | number = "";
    let abbreviation: string = "";
    // margin, padding, width, height
    if (spacing.includes(style)) {
      abbreviation = style.charAt(0);
      if (style.includes("-")) {
        const direction = style.split("-")[1].charAt(0);
        abbreviation += direction;
      }
      if (styleValue === "auto" && style.startsWith("margin")) {
        tailwindValue = "auto";
      } else if (styleValue === "0") {
        tailwindValue = 0;
      } else if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
        tailwindValue = getClosestValue(sizes, styleNumber * 4);
      } else if (styleValue.includes("rem")) {
        tailwindValue = getClosestValue(sizes, styleNumber * 4);
      } else if (styleValue.includes("%")) {
        if (style === "margin" || style === "padding") {
          continue;
        }
        const tailwindDecimal = getClosestValue(
          Object.keys(percentages),
          styleNumber / 100
        );
        tailwindValue = percentages[tailwindDecimal as keyof object];
      } else if (style === "width" || style === "height") {
        tailwindValue = get(spacingCustom, styleValue, "");
      }
    } else if (style === "font-size") {
      abbreviation = "text";
      let size: string | number = "";
      if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
        size = getClosestValue(Object.keys(fontSize), styleNumber);
      } else if (styleValue.includes("rem")) {
        size = getClosestValue(Object.keys(fontSize), styleNumber);
      }
      tailwindValue = get(fontSize, size, "");
    } else if (style === "font-weight") {
      abbreviation = "font";
      if (styleValue === "normal") styleNumber = 400;
      if (styleValue === "bold") styleNumber = 700;
      tailwindValue = get(fontWeight, styleNumber, "");
    } else if (style === "font-style") {
      tailwindValue = styleValue === "italic" ? "italic" : "non-italic";
    } else if (style === "display") {
      tailwindValue = styleValue === "none" ? "hidden" : styleValue;
    } else if (style === "position") {
      tailwindValue = styleValue;
    } else if (style === "z-index") {
      abbreviation = "z";
      tailwindValue =
        styleValue === "auto"
          ? "auto"
          : getClosestValue(zIndex, Number(styleValue));
    } else if (style === "letter-spacing") {
      abbreviation = "tracking";
      const spacingNumber = getClosestValue(letterSpacing, styleNumber);
      tailwindValue = spacingValues[letterSpacing.indexOf(spacingNumber)];
    } else if (style === "text-decoration-thickness") {
      abbreviation = "decoration";
      if (styleValue === "auto" || styleValue === "from-font") {
        tailwindValue = styleValue;
      } else if (styleNumber) {
        tailwindValue = getClosestValue(borderValues, styleNumber);
      } else break;
    } else if (style === "text-underline-offset") {
      abbreviation = "underline-offset";
      if (styleValue === "auto") {
        tailwindValue = styleValue;
      } else if (styleNumber) {
        tailwindValue = getClosestValue(borderValues, styleNumber);
      } else break;
    } else if (style === "text-indent") {
      abbreviation = "indent";
      if (styleValue === "1px") {
        tailwindValue = "px";
      } else if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
      }
      tailwindValue = getClosestValue(sizes, styleNumber * 4);
    } else if (style === "outline-width") {
      abbreviation = "outline";
      tailwindValue = getClosestValue(borderValues, styleNumber);
    } else if (style === "outline-offset") {
      abbreviation = "outline-offset";
      tailwindValue = getClosestValue(borderValues, styleNumber);
    } else if (style === "opacity") {
      abbreviation = "opacity";
      tailwindValue = getClosestValue(opacity, styleNumber * 100);
    } else if (style === "cursor") {
      abbreviation = "cursor";
      tailwindValue = styleValue;
    } else if (style === "box-shadow") {
      tailwindValue = shadowClassFor(styleValue);
    } else if (
      style === "grid-template-columns" ||
      style === "grid-template-rows"
    ) {
      tailwindValue = gridTemplateClassFor(style, styleValue);
    } else if (style === "transition-duration") {
      abbreviation = "duration";
      if (!styleValue.includes("ms")) styleNumber = styleNumber * 1000;
      tailwindValue = getClosestValue(duration, styleNumber);
    } else if (style === "transition-delay") {
      abbreviation = "delay";
      if (!styleValue.includes("ms")) styleNumber = styleNumber * 1000;
      tailwindValue = getClosestValue(duration, styleNumber);
    } else if (style === "transition-property") {
      tailwindValue = transitionPropertyClassFor(styleValue);
    } else if (style === "transition-timing-function") {
      tailwindValue = transitionTimingClassFor(styleValue);
    } else if (style === "order") {
      abbreviation = "order";
      if (styleNumber === -9999) tailwindValue = "first";
      else if (styleNumber === 9999) tailwindValue = "last";
      else if (styleNumber === 0) tailwindValue = "none";
      else if (Number(styleNumber) <= 12) {
        tailwindValue = String(styleNumber);
      }
    } else if (style === "gap") {
      abbreviation = "gap";
      if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
      }
      tailwindValue = getClosestValue(sizes, styleNumber * 4);
    } else if (style === "column-gap") {
      abbreviation = "gap-x";
      if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
      }
      tailwindValue = getClosestValue(sizes, styleNumber * 4);
    } else if (style === "row-gap") {
      abbreviation = "gap-y";
      if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
      }
      tailwindValue = getClosestValue(sizes, styleNumber * 4);
    } else if (style === "-webkit-font-smoothing") {
      if (styleValue === "antialiased") tailwindValue = "antialiased";
      else if (styleValue === "auto") tailwindValue = "subpixel-antialiased";
    } else if (style in mainDict) {
      tailwindValue = mainDict[style][styleValue];
    } else if (style === "columns") {
      abbreviation = "columns";
      let size = 0;
      if (
        (Number(styleValue) <= 12 && Number(styleValue) > 0) ||
        styleValue === "auto"
      ) {
        tailwindValue = styleValue;
      } else if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
        size = getClosestValue(Object.keys(columnSizes), styleNumber);
      } else if (styleValue.includes("rem")) {
        size = getClosestValue(Object.keys(columnSizes), styleNumber);
      }
      if (size) {
        tailwindValue = columnSizes[size];
      }
    } else if (Object.keys(colorDict).includes(style)) {
      try {
        abbreviation = colorDict[style];
        if (styleValue === "inherit") tailwindValue = "inherit";
        else if (styleValue === "currentcolor") tailwindValue = "current";
        else if (styleValue === "transparent") tailwindValue = "transparent";
        else if (styleValue === "none") tailwindValue = "none";
        else if (styleValue.includes("var(")) tailwindValue = "";
        else {
          //only hex #ff0000 and rgb values rgb(255, 0, 0) are currently supported
          tailwindValue = NearestColor.from(colorCodes)(styleValue).name;
        }
      } catch (e) {
        console.error(`Invalid color: ${e}`);
      }
    } else if (style === "font-family") {
      abbreviation = "font";
      if (styleValue.includes("sans-serif")) tailwindValue = "sans";
      else if (styleValue.includes("serif")) tailwindValue = "serif";
      else if (styleValue.includes("monospace")) tailwindValue = "mono";
    } else if (style === "text-overflow") {
      abbreviation = "text";
      if (styleValue === "ellipsis") tailwindValue = "ellipsis";
      else if (styleValue === "clip") tailwindValue = "clip";
    } else if (style === "overflow-wrap") {
      abbreviation = "break";
      if (styleValue === "normal") tailwindValue = "normal";
      else if (styleValue === "break-word") tailwindValue = "words";
    } else if (style === "word-break") {
      abbreviation = "break";
      if (styleValue === "break-all") tailwindValue = "all";
      else if (styleValue === "keep-all") tailwindValue = "keep";
    } else if (style === "line-height") {
      abbreviation = "leading";
      if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
      }
      const height = getClosestValue(Object.keys(lineHeight), styleNumber);
      tailwindValue = lineHeight[height];
    } else if (
      style.includes("scroll-margin") ||
      style.includes("scroll-padding")
    ) {
      abbreviation = style.includes("scroll-margin") ? "scroll-m" : "scroll-p";
      if (styleValue.includes("px")) {
        styleNumber = styleNumber / 16;
      }
      tailwindValue = getClosestValue(sizes, styleNumber * 4);
      if (style.includes("top")) abbreviation += "t";
      if (style.includes("bottom")) abbreviation += "b";
      if (style.includes("right")) abbreviation += "r";
      if (style.includes("left")) abbreviation += "l";
      if (styleValue === "1px") tailwindValue = "px";
    } else if (style === "transform") {
      if (styleValue.includes("skew")) {
        abbreviation = styleValue.includes("skewx") ? "skew-x" : "skew-y";
        tailwindValue = getClosestValue(skew, styleNumber);
      } else if (styleValue.includes("rotate")) {
        abbreviation = "rotate";
        tailwindValue = getClosestValue(rotate, styleNumber);
      } else if (styleValue.includes("scale")) {
        abbreviation = "scale";
        if (styleValue.includes("scalex")) abbreviation += "-x";
        else if (styleValue.includes("scaley")) abbreviation += "-y";
        tailwindValue = getClosestValue(scale, styleNumber * 100);
      } else if (styleValue.includes("translate")) {
        abbreviation = styleValue.includes("translatex")
          ? "translate-x"
          : "translate-y";
        if (styleValue.includes("px")) {
          if (styleNumber == 1) tailwindValue = "px";
          styleNumber = styleNumber / 16;
        }
        if (tailwindValue != "px") {
          tailwindValue = getClosestValue(sizes, styleNumber * 4);
        }
        if (styleValue.includes("%")) {
          const translateValue = getClosestValue(
            Object.keys(translate),
            styleNumber
          );
          tailwindValue = translate[translateValue];
        }
      }
    } else if (style === "scroll-snap-type") {
      abbreviation = "snap";
      if (styleValue === "none") tailwindValue = "none";
    } else if (style === "flex-basis") {
      abbreviation = "basis";
      if (styleValue.includes("px")) {
        if (styleNumber == 1) tailwindValue = "px";
        styleNumber = styleNumber / 16;
      }
      if (
        tailwindValue != "px" &&
        !styleValue.includes("%") &&
        validValue(styleValue)
      ) {
        tailwindValue = getClosestValue(sizes, styleNumber * 4);
      }
      if (styleValue === "auto") {
        tailwindValue = "auto";
      }
      if (styleValue.includes("%")) {
        const tailwindDecimal = getClosestValue(
          Object.keys(percentages),
          styleNumber / 100
        );
        tailwindValue = percentages[tailwindDecimal as keyof object];
      }
    } else if (["top", "bottom", "right", "left"].includes(style)) {
      abbreviation = style;
      if (styleValue.includes("px")) {
        if (styleNumber == 1) tailwindValue = "px";
        styleNumber = styleNumber / 16;
      }
      if (
        tailwindValue != "px" &&
        !styleValue.includes("%") &&
        validValue(styleValue)
      ) {
        tailwindValue = getClosestValue(sizes, styleNumber * 4);
      }
      if (styleValue === "auto") {
        tailwindValue = "auto";
      }
      if (styleValue.includes("%")) {
        const tailwindDecimal = getClosestValue(
          Object.keys(percentages),
          styleNumber / 100
        );
        tailwindValue = percentages[tailwindDecimal as keyof object];
      }
    } else if (style.includes("border") && style.includes("width")) {
      abbreviation = "border";
      tailwindValue = getClosestValue(borderValues, styleNumber);
      if (style.includes("top")) abbreviation += "-t";
      if (style.includes("bottom")) abbreviation += "-b";
      if (style.includes("left")) abbreviation += "-l";
      if (style.includes("right")) abbreviation += "-r";
      if (tailwindValue === 1) {
        tailwindValue = abbreviation;
        abbreviation = "";
      }
    } else if (style === "border-radius") {
      if (mode !== "exact" && splitCssValue(styleValue).length > 1) {
        result.push({
          property: style,
          value: originalValue,
          className: "",
          status: "unsupported",
          message:
            "Multi-value border-radius needs exact mode or manual review."
        });
        continue;
      }
      if (validValue(styleValue)) {
        abbreviation = "rounded";
        if (styleValue.includes("px")) {
          styleNumber = styleNumber / 16;
        }
        const size = getClosestValue(Object.keys(borderRadius), styleNumber);
        tailwindValue = borderRadius[size];
        if (tailwindValue === "") {
          abbreviation = "";
          tailwindValue = "rounded";
        }
      }
    } else if (style === "max-height") {
      abbreviation = "max-h";
      const maxHeightValues: { [index: string]: string } = {
        "100%": "full",
        "100vh": "screen",
        "min-content": "min",
        "max-content": "max",
        "fit-content": "fit"
      };
      if (styleValue === "1px") {
        tailwindValue = "px";
      } else if (validValue(styleValue)) {
        if (styleValue.includes("px")) {
          styleNumber = styleNumber / 16;
        }
        tailwindValue = getClosestValue(sizes, styleNumber * 4);
      } else if (Object.keys(maxHeightValues).includes(styleValue)) {
        tailwindValue = maxHeightValues[styleValue];
      }
    } else if (style === "max-width") {
      abbreviation = "max-w";
      const maxWidthValues: { [index: string]: string } = {
        "100%": "full",
        "min-content": "min",
        "max-content": "max",
        "fit-content": "fit"
      };
      if (styleValue === "none") tailwindValue = "none";
      else if (validValue(styleValue)) {
        if (styleValue.includes("px")) {
          styleNumber = styleNumber / 16;
        }
        const size = getClosestValue(Object.keys(maxWidth), styleNumber);
        tailwindValue = maxWidth[size];
      } else if (Object.keys(maxWidthValues).includes(styleValue)) {
        tailwindValue = maxWidthValues[styleValue];
      }
    }
    if (style === "filter" || style === "backdrop-filter") {
      //TODO Refactor because there can be multiple filters
      if (styleValue.includes("blur")) {
        if (styleValue.includes("rem")) {
          styleNumber = styleNumber * 16;
        }
        if (validValue(styleValue)) {
          abbreviation = "blur";
          const size = getClosestValue(Object.keys(blur), styleNumber);
          tailwindValue = blur[size];
          if (!tailwindValue) {
            abbreviation = "";
            tailwindValue = "blur";
          }
        }
      } else if (styleValue.includes("brightness")) {
        abbreviation = "brightness";
        tailwindValue = getClosestValue(brightness, styleNumber * 100);
      } else if (styleValue.includes("contrast")) {
        abbreviation = "contrast";
        tailwindValue = getClosestValue(contrast, styleNumber * 100);
      } else if (styleValue.includes("hue-rotate")) {
        abbreviation = "hue-rotate";
        tailwindValue = getClosestValue(hueRotate, styleNumber);
      } else if (styleValue.includes("saturate")) {
        abbreviation = "saturate";
        tailwindValue = getClosestValue(saturate, styleNumber * 100);
      }
      if (
        (style === "backdrop-filter" && abbreviation != "") ||
        styleValue.includes("opacity")
      ) {
        abbreviation = "backdrop-" + abbreviation;
        if (styleValue.includes("opacity")) {
          abbreviation += "opacity";
          tailwindValue = getClosestValue(opacity, styleNumber * 100);
        }
      }
    }
    if (tailwindValue !== "" && tailwindValue !== undefined) {
      if (negativeValue) abbreviation = "-" + abbreviation;
      const className = abbreviation
        ? (abbreviation += "-" + tailwindValue)
        : String(tailwindValue);
      const exactClass = exactClassFor(style, originalValue);
      const shouldUseExact = mode === "exact" && exactClass;
      const isExactSpacingToken =
        (originalValue.trim() === "0" && tailwindValue === 0) ||
        (originalValue.trim().toLowerCase() === "auto" &&
          tailwindValue === "auto");
      const status =
        shouldUseExact || !exactClass || isExactSpacingToken
          ? "converted"
          : "approximated";
      result.push({
        property: style,
        value: originalValue,
        className: shouldUseExact ? exactClass : className,
        status,
        message:
          status === "approximated"
            ? "Mapped to the nearest Tailwind design token."
            : undefined
      });
    } else {
      const exactClass = mode === "exact" ? exactClassFor(style, originalValue) : "";
      result.push({
        property: style,
        value: originalValue,
        className: exactClass,
        status: exactClass ? "converted" : "unsupported",
        message: exactClass
          ? undefined
          : "No Tailwind utility mapping exists yet for this declaration."
      });
    }
  }
  return result;
};

export const convertAttributes = (attributes: { [index: string]: string }) => {
  return convertAttributesDetailed(attributes)
    .filter((item) => item.className)
    .map((item) => item.className);
};
