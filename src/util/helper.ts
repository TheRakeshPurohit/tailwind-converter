import {
  ConversionMode,
  DeclarationConversion,
  convertAttributes,
  convertAttributesDetailed,
} from "./converter";
import DOMPurify from "dompurify";
import postcss, { AtRule, Declaration, Rule } from "postcss";
import valueParser from "postcss-value-parser";

export const initialHTML = `<html lang="en">
<body>
  <div class="main">
    <h2>Welcome to Tailwind Converter!</h2>
    <p>Edit/paste HTML here and CSS into
      the editor below
    </p>
  </div>
</body>
</html>`;

export const initialCSS = `body {
  margin: 1rem;
  padding: 1rem;
}

.main {
  text-align: center;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: blue;
}`;

type CSSProperties = {
  [property: string]: string;
};

type CSSJson = {
  [selector: string]: CSSProperties;
};

type SelectorAnalysis = {
  originalSelector: string;
  applySelector: string;
  variantPrefix: string;
  canApply: boolean;
  preserveOriginalClass?: boolean;
  warning?: string;
};

type NormalizedDeclarations = {
  style: CSSProperties;
  preservedDeclarations: Declaration[];
};

export type UnsupportedCategory =
  | "unsupported-property"
  | "unsupported-value"
  | "complex-selector"
  | "relationship-based"
  | "pseudo-element"
  | "media-query"
  | "keyframes"
  | "css-variable"
  | "compound-shorthand"
  | "tailwind-gap";

export type ConversionIssue = {
  selector: string;
  property?: string;
  value?: string;
  category: UnsupportedCategory;
  message: string;
};

export type RuleConversion = {
  selector: string;
  classes: string;
  declarations: DeclarationConversion[];
  atRules: string[];
  canApply: boolean;
  preserveOriginalClass: boolean;
};

export type PreservedRule = {
  selector: string;
  category: UnsupportedCategory;
  message: string;
  css: string;
  atRules: string[];
};

export type ConversionResult = {
  html: string;
  rules: RuleConversion[];
  preservedRules: PreservedRule[];
  converted: DeclarationConversion[];
  approximated: DeclarationConversion[];
  unsupported: ConversionIssue[];
  warnings: ConversionIssue[];
  leftoverCss: string;
};

const simpleSelectorPattern = String.raw`(?:\.[_a-zA-Z][\w-]*|#[A-Za-z_][\w-]*|[a-zA-Z][\w-]*)`;
const simpleSelector = new RegExp(`^${simpleSelectorPattern}$`);

const getSimpleDescendantParts = (selector: string) => {
  const parts = selector.trim().split(/\s+/);
  if (parts.length < 2) return null;
  return parts.every((part) => simpleSelector.test(part)) ? parts : null;
};

const pseudoClassVariants: { [pseudoClass: string]: string } = {
  hover: "hover",
  focus: "focus",
  active: "active",
  visited: "visited",
  disabled: "disabled",
  checked: "checked",
  "focus-visible": "focus-visible",
  "focus-within": "focus-within",
  required: "required",
  invalid: "invalid",
  valid: "valid",
  enabled: "enabled",
  "first-child": "first",
  "last-child": "last",
};

const tailwindGapProperties = new Set([
  "filter",
  "grid-column",
  "grid-row",
]);

const unsupportedProperties = new Set([
  "animation",
  "border-spacing",
]);

const classifyUnsupported = ({
  selector,
  property,
  value,
  fallback = "unsupported-property",
}: {
  selector: string;
  property?: string;
  value?: string;
  fallback?: UnsupportedCategory;
}): UnsupportedCategory => {
  const normalizedProperty = property?.toLowerCase();
  const normalizedValue = value?.toLowerCase() ?? "";

  if (selector.includes("::")) return "pseudo-element";
  if (/\s|>|\+|~/.test(selector.trim())) return "relationship-based";
  if (normalizedValue.includes("var(")) return "css-variable";
  if (normalizedProperty && tailwindGapProperties.has(normalizedProperty)) {
    return "tailwind-gap";
  }
  if (normalizedProperty && unsupportedProperties.has(normalizedProperty)) {
    return "unsupported-property";
  }
  if (
    normalizedProperty === "background" ||
    normalizedProperty === "font" ||
    normalizedProperty?.startsWith("border")
  ) {
    return "compound-shorthand";
  }

  return fallback;
};

const getUnsupportedMessage = ({
  property,
  value,
  category,
  fallbackMessage,
}: {
  property?: string;
  value?: string;
  category: UnsupportedCategory;
  fallbackMessage: string;
}) => {
  const normalizedProperty = property?.toLowerCase();
  const normalizedValue = value?.toLowerCase() ?? "";

  if (category === "css-variable") {
    return "CSS variable values are preserved. Tailwind theme token mapping is not implemented yet.";
  }

  if (category === "relationship-based") {
    return "This selector targets related elements. Converting it safely would require changing HTML structure.";
  }

  if (category === "pseudo-element") {
    return "Pseudo-elements are preserved because generated elements cannot be represented as classes on the original element.";
  }

  if (category === "media-query") {
    return "This at-rule is preserved because it does not match a default Tailwind responsive breakpoint.";
  }

  if (category === "keyframes") {
    return "Keyframes are preserved. animation and @keyframes conversion is not implemented yet.";
  }

  if (normalizedProperty === "box-shadow") {
    return "This box-shadow value is preserved because it could not be mapped to a Tailwind shadow utility.";
  }

  if (
    normalizedProperty === "background-image" ||
    normalizedValue.includes("gradient(")
  ) {
    return "Background images and gradients are preserved in token mode. Use Exact mode to emit an arbitrary background image utility.";
  }

  if (normalizedProperty === "animation") {
    return "Animations are preserved. animation and @keyframes conversion is not implemented yet.";
  }

  if (
    normalizedProperty === "grid-template-columns" ||
    normalizedProperty === "grid-template-rows"
  ) {
    return "This grid template is preserved because it could not be mapped to a supported Tailwind grid utility.";
  }

  if (normalizedProperty === "grid-column" || normalizedProperty === "grid-row") {
    return "Grid placement is preserved. Mapping spans and line numbers to Tailwind is not implemented yet.";
  }

  if (normalizedProperty === "transition-property") {
    return "Transition properties are preserved. Tailwind transition-property mapping is not implemented yet.";
  }

  if (normalizedProperty === "transition-timing-function") {
    return "Transition timing functions are preserved. Tailwind easing mapping is not implemented yet.";
  }

  if (category === "compound-shorthand") {
    return "This shorthand is preserved because some parts could not be safely expanded.";
  }

  if (category === "tailwind-gap") {
    return "This CSS maps to a Tailwind utility family that is not supported yet.";
  }

  return fallbackMessage;
};

const splitSelectorList = (selector: string) => {
  const selectors: string[] = [];
  let current = "";
  let bracketDepth = 0;
  let parenDepth = 0;
  let quote: string | null = null;

  for (const character of selector) {
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === "[") bracketDepth += 1;
    if (character === "]") bracketDepth -= 1;
    if (character === "(") parenDepth += 1;
    if (character === ")") parenDepth -= 1;

    if (character === "," && bracketDepth === 0 && parenDepth === 0) {
      selectors.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  if (current.trim()) selectors.push(current.trim());
  return selectors;
};

const analyzeSelector = (selector: string): SelectorAnalysis => {
  if (simpleSelector.test(selector)) {
    return {
      originalSelector: selector,
      applySelector: selector,
      variantPrefix: "",
      canApply: true,
    };
  }

  if (getSimpleDescendantParts(selector)) {
    return {
      originalSelector: selector,
      applySelector: selector,
      variantPrefix: "",
      canApply: true,
      preserveOriginalClass: true,
      warning:
        "Descendant selector was applied to currently matched elements. Review if this relationship is dynamic.",
    };
  }

  const descendantPseudoClassSelector = new RegExp(
    `^(${simpleSelectorPattern}(?:\\s+${simpleSelectorPattern})+):([a-z-]+)$`
  );
  const descendantPseudoClassMatch = selector.match(descendantPseudoClassSelector);
  if (descendantPseudoClassMatch) {
    const [, applySelector, pseudoClass] = descendantPseudoClassMatch;
    const variant = pseudoClassVariants[pseudoClass];
    if (variant && getSimpleDescendantParts(applySelector)) {
      return {
        originalSelector: selector,
        applySelector,
        variantPrefix: `${variant}:`,
        canApply: true,
        preserveOriginalClass: true,
        warning:
          "Descendant selector was applied to currently matched elements. Review if this relationship is dynamic.",
      };
    }
  }

  const pseudoClassSelector = new RegExp(
    `^(${simpleSelectorPattern}):([a-z-]+)$`
  );
  const pseudoClassMatch = selector.match(pseudoClassSelector);
  if (pseudoClassMatch) {
    const [, applySelector, pseudoClass] = pseudoClassMatch;
    const variant = pseudoClassVariants[pseudoClass];
    if (variant) {
      return {
        originalSelector: selector,
        applySelector,
        variantPrefix: `${variant}:`,
        canApply: true,
      };
    }
  }

  const nthChildSelector = new RegExp(
    `^(${simpleSelectorPattern}):nth-child\\((odd|even)\\)$`
  );
  const nthChildMatch = selector.match(nthChildSelector);
  if (nthChildMatch) {
    const [, applySelector, variant] = nthChildMatch;
    return {
      originalSelector: selector,
      applySelector,
      variantPrefix: `${variant}:`,
      canApply: true,
    };
  }

  return {
    originalSelector: selector,
    applySelector: selector,
    variantPrefix: "",
    canApply: false,
    warning:
      "Complex selectors are reported for review because moving them inline can change behavior.",
  };
};

const breakpointPrefixes: { [query: string]: string } = {
  "(min-width: 640px)": "sm",
  "(min-width: 40rem)": "sm",
  "(min-width: 768px)": "md",
  "(min-width: 48rem)": "md",
  "(min-width: 1024px)": "lg",
  "(min-width: 64rem)": "lg",
  "(min-width: 1280px)": "xl",
  "(min-width: 80rem)": "xl",
  "(min-width: 1536px)": "2xl",
  "(min-width: 96rem)": "2xl",
};

const atRuleToString = (atRule: AtRule) =>
  atRule.params ? `@${atRule.name} ${atRule.params}` : `@${atRule.name}`;

const isKeyframesAtRule = (atRule: string) =>
  /^@(?:-\w+-)?keyframes\b/.test(atRule);

const unsupportedAtRuleCategory = (atRules: string[]): UnsupportedCategory =>
  atRules.some(isKeyframesAtRule) ? "keyframes" : "media-query";

const classPrefixForAtRules = (atRules: string[]) => {
  const prefixes: string[] = [];

  for (const atRule of atRules) {
    const normalized = atRule.replace(/\s+/g, " ").trim();
    if (!normalized.startsWith("@media ")) return "";

    const query = normalized.replace("@media ", "");
    const prefix = breakpointPrefixes[query];
    if (!prefix) return "";
    prefixes.push(prefix);
  }

  return prefixes.length > 0 ? `${prefixes.join(":")}:` : "";
};

const appendLeftover = (
  leftovers: string[],
  selector: string,
  declarations: Pick<Declaration, "prop" | "value">[],
  atRules: string[] = []
) => {
  if (declarations.length === 0) return "";

  const body = declarations
    .map((declaration) => `  ${declaration.prop}: ${declaration.value};`)
    .join("\n");
  let css = `${selector} {\n${body}\n}`;

  for (const atRule of atRules.slice().reverse()) {
    css = `${atRule} {\n${css
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n")}\n}`;
  }

  leftovers.push(css);
  return css;
};

const splitCssValue = (value: string) => {
  const parts: string[] = [];
  let current = "";

  valueParser(value).nodes.forEach((node) => {
    if (node.type === "space") {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else if (node.type === "div" && node.value === "/") {
      if (current) {
        parts.push(current);
        current = "";
      }
      parts.push("/");
    } else {
      current += valueParser.stringify(node);
    }
  });

  if (current) parts.push(current);
  return parts;
};

const hasTopLevelComma = (value: string) =>
  valueParser(value).nodes.some((node) => node.type === "div" && node.value === ",");

const expandBoxShorthand = (property: "margin" | "padding", value: string) => {
  const values = splitCssValue(value);
  if (values.length < 1 || values.length > 4) return null;
  if (values.length === 1) {
    return {
      [property]: values[0],
    };
  }

  const [top, right = top, bottom = top, left = right] = values;
  return {
    [`${property}-top`]: top,
    [`${property}-right`]: right,
    [`${property}-bottom`]: bottom,
    [`${property}-left`]: left,
  };
};

const borderStyles = new Set([
  "solid",
  "dashed",
  "dotted",
  "double",
  "hidden",
  "none",
]);

const borderWidthKeywords: { [keyword: string]: string } = {
  thin: "1px",
  medium: "2px",
  thick: "4px",
};

const borderSides: { [property: string]: string } = {
  border: "border",
  "border-top": "border-top",
  "border-right": "border-right",
  "border-bottom": "border-bottom",
  "border-left": "border-left",
};

const colorKeywords = new Set([
  "transparent",
  "currentcolor",
  "currentColor",
  "inherit",
  "black",
  "white",
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "gray",
  "grey",
  "slate",
  "zinc",
  "neutral",
  "stone",
  "cyan",
  "teal",
  "emerald",
  "lime",
  "amber",
  "indigo",
  "violet",
  "fuchsia",
  "rose",
  "sky",
]);

const isLengthValue = (value: string) =>
  value === "0" ||
  /^-?\d*\.?\d+(px|rem|em|%)$/.test(value) ||
  value.startsWith("calc(") ||
  borderWidthKeywords[value] !== undefined;

const isColorValue = (value: string) =>
  value.startsWith("#") ||
  /^rgba?\(/i.test(value) ||
  /^hsla?\(/i.test(value) ||
  colorKeywords.has(value);

const isBackgroundImageValue = (value: string) => {
  const nodes = valueParser(value).nodes.filter((node) => node.type !== "space");
  if (nodes.length !== 1 || nodes[0].type !== "function") return false;

  const functionName = nodes[0].value.toLowerCase();
  return functionName === "url" || functionName.endsWith("gradient");
};

const backgroundAttachments = new Set(["fixed", "local", "scroll"]);
const backgroundRepeats = new Set([
  "repeat",
  "no-repeat",
  "repeat-x",
  "repeat-y",
  "round",
  "space",
]);
const backgroundSizes = new Set(["auto", "cover", "contain"]);
const backgroundPositionKeywords = new Set([
  "top",
  "right",
  "bottom",
  "left",
  "center",
]);

const normalizeBackgroundPosition = (tokens: string[]) => {
  if (tokens.length === 0) return "";
  const normalizedTokens = tokens.map((token) => token.toLowerCase());
  if (!normalizedTokens.every((token) => backgroundPositionKeywords.has(token))) {
    return "";
  }

  if (normalizedTokens.length === 1) return normalizedTokens[0];
  if (normalizedTokens.length !== 2) return "";

  const [first, second] = normalizedTokens;
  if (first === second && first === "center") return "center";

  const horizontal = normalizedTokens.find((token) =>
    ["left", "right"].includes(token)
  );
  const vertical = normalizedTokens.find((token) =>
    ["top", "bottom"].includes(token)
  );

  if (horizontal && vertical) return `${horizontal} ${vertical}`;
  if (horizontal && normalizedTokens.includes("center")) return horizontal;
  if (vertical && normalizedTokens.includes("center")) return vertical;

  return "";
};

const expandBorderShorthand = (property: string, value: string) => {
  const borderProperty = borderSides[property];
  if (!borderProperty) return null;

  const values = splitCssValue(value);
  if (values.length === 0) return null;

  const expanded: CSSProperties = {};
  const unknownValues: string[] = [];

  values.forEach((part) => {
    const normalizedPart = part.toLowerCase();
    if (isLengthValue(normalizedPart)) {
      expanded[`${borderProperty}-width`] =
        borderWidthKeywords[normalizedPart] ?? part;
    } else if (borderStyles.has(normalizedPart)) {
      expanded["border-style"] = normalizedPart;
    } else if (isColorValue(part) || isColorValue(normalizedPart)) {
      expanded[`${borderProperty}-color`] = part;
    } else {
      unknownValues.push(part);
    }
  });

  return {
    expanded,
    canConvert: Object.keys(expanded).length > 0 && unknownValues.length === 0,
  };
};

const expandBorderColorShorthand = (value: string) => {
  const values = splitCssValue(value);
  if (values.length < 1 || values.length > 4) return null;
  if (!values.every((part) => isColorValue(part) || isColorValue(part.toLowerCase()))) {
    return null;
  }

  if (values.length === 1) {
    return {
      "border-color": values[0],
    };
  }

  const [top, right = top, bottom = top, left = right] = values;
  return {
    "border-top-color": top,
    "border-right-color": right,
    "border-bottom-color": bottom,
    "border-left-color": left,
  };
};

const expandBackgroundShorthand = (value: string) => {
  if (hasTopLevelComma(value)) return null;

  const values = splitCssValue(value);
  if (values.length === 1 && (isColorValue(values[0]) || isColorValue(values[0].toLowerCase()))) {
    return {
      "background-color": values[0],
    };
  }

  if (isBackgroundImageValue(value)) {
    return {
      "background-image": value,
    };
  }

  const expanded: CSSProperties = {};
  const positionTokens: string[] = [];
  const sizeTokens: string[] = [];
  let readingSize = false;
  let unknownValue = false;

  for (const part of values) {
    const normalizedPart = part.toLowerCase();

    if (part === "/") {
      if (readingSize) {
        unknownValue = true;
        break;
      }
      readingSize = true;
      continue;
    }

    if (isBackgroundImageValue(part)) {
      if (expanded["background-image"]) {
        unknownValue = true;
        break;
      }
      expanded["background-image"] = part;
      continue;
    }

    if (isColorValue(part) || isColorValue(normalizedPart)) {
      if (expanded["background-color"]) {
        unknownValue = true;
        break;
      }
      expanded["background-color"] = part;
      continue;
    }

    if (backgroundAttachments.has(normalizedPart)) {
      if (expanded["background-attachment"]) {
        unknownValue = true;
        break;
      }
      expanded["background-attachment"] = normalizedPart;
      continue;
    }

    if (backgroundRepeats.has(normalizedPart)) {
      if (expanded["background-repeat"]) {
        unknownValue = true;
        break;
      }
      expanded["background-repeat"] = normalizedPart;
      continue;
    }

    if (readingSize) {
      sizeTokens.push(part);
      continue;
    }

    positionTokens.push(part);
  }

  const backgroundPosition = normalizeBackgroundPosition(positionTokens);
  if (positionTokens.length > 0 && !backgroundPosition) unknownValue = true;
  if (backgroundPosition) expanded["background-position"] = backgroundPosition;

  if (sizeTokens.length > 0) {
    const backgroundSize = sizeTokens.join(" ").toLowerCase();
    if (sizeTokens.length === 1 && backgroundSizes.has(backgroundSize)) {
      expanded["background-size"] = backgroundSize;
    } else {
      unknownValue = true;
    }
  }

  if (
    unknownValue ||
    Object.keys(expanded).length === 0 ||
    (readingSize && sizeTokens.length === 0)
  ) {
    return null;
  }

  return expanded;
};

const fontStyleValues = new Set(["normal", "italic", "oblique"]);
const fontWeightValues = new Set([
  "normal",
  "bold",
  "bolder",
  "lighter",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
]);
const fontVariantValues = new Set(["small-caps"]);
const systemFontValues = new Set([
  "caption",
  "icon",
  "menu",
  "message-box",
  "small-caption",
  "status-bar",
]);

const isFontSizeValue = (value: string) =>
  /^(xx-small|x-small|small|medium|large|x-large|xx-large|larger|smaller)$/.test(
    value
  ) || /^\d*\.?\d+(px|rem|em|%)?(\/.+)?$/.test(value);

const isConvertibleFontSizeValue = (value: string) =>
  /^\d*\.?\d+(px|rem)(\/.+)?$/.test(value);

const normalizeFontWeight = (value: string) => {
  if (value === "normal") return "400";
  if (value === "bold") return "700";
  return /^\d+$/.test(value) ? value : "";
};

const expandFontShorthand = (value: string) => {
  const values = splitCssValue(value);
  if (values.length === 1 && systemFontValues.has(values[0].toLowerCase())) {
    return null;
  }

  const expanded: CSSProperties = {};
  let fontSizeIndex = -1;

  for (let index = 0; index < values.length; index += 1) {
    const part = values[index];
    const normalizedPart = part.toLowerCase();

    if (fontStyleValues.has(normalizedPart)) {
      if (normalizedPart !== "normal") expanded["font-style"] = normalizedPart;
      continue;
    }

    if (fontWeightValues.has(normalizedPart)) {
      const fontWeight = normalizeFontWeight(normalizedPart);
      if (fontWeight) expanded["font-weight"] = fontWeight;
      continue;
    }

    if (fontVariantValues.has(normalizedPart)) {
      continue;
    }

    if (isFontSizeValue(normalizedPart)) {
      if (!isConvertibleFontSizeValue(normalizedPart)) return null;
      fontSizeIndex = index;
      const [fontSize, lineHeight] = part.split("/");
      expanded["font-size"] = fontSize;
      if (lineHeight) expanded["line-height"] = lineHeight;
      break;
    }

    return null;
  }

  if (fontSizeIndex === -1 || fontSizeIndex === values.length - 1) return null;

  const familyStartIndex =
    values[fontSizeIndex + 1] === "/" ? fontSizeIndex + 3 : fontSizeIndex + 1;
  const spacedLineHeight = values[fontSizeIndex + 2];
  if (values[fontSizeIndex + 1] === "/" && spacedLineHeight) {
    expanded["line-height"] = spacedLineHeight;
  }
  if (familyStartIndex > values.length - 1) return null;

  expanded["font-family"] = values.slice(familyStartIndex).join(" ");
  return expanded;
};

const isTransitionTime = (value: string) => /^-?\d*\.?\d+m?s$/.test(value);

const isTransitionTiming = (value: string) =>
  /^(linear|ease|ease-in|ease-out|ease-in-out)$/.test(value) ||
  value.startsWith("cubic-bezier(");

const expandTransitionShorthand = (value: string) => {
  if (hasTopLevelComma(value)) return null;

  const values = splitCssValue(value);
  if (values.length === 0) return null;

  const expanded: CSSProperties = {};
  const timeValues: string[] = [];

  for (const part of values) {
    const normalizedPart = part.toLowerCase();

    if (normalizedPart === "normal") continue;

    if (isTransitionTime(normalizedPart)) {
      timeValues.push(part);
      continue;
    }

    if (isTransitionTiming(normalizedPart)) {
      expanded["transition-timing-function"] = part;
      continue;
    }

    if (!expanded["transition-property"]) {
      expanded["transition-property"] = part;
      continue;
    }

    return null;
  }

  if (timeValues[0]) expanded["transition-duration"] = timeValues[0];
  if (timeValues[1]) expanded["transition-delay"] = timeValues[1];
  if (!expanded["transition-property"]) {
    expanded["transition-property"] = "all";
  }

  return Object.keys(expanded).length > 0 ? expanded : null;
};

const expandListStyleShorthand = (value: string) => {
  const values = splitCssValue(value);
  if (values.length !== 1) return null;

  const normalizedValue = values[0].toLowerCase();
  if (["none", "disc", "decimal"].includes(normalizedValue)) {
    return {
      "list-style-type": normalizedValue,
    };
  }

  if (["inside", "outside"].includes(normalizedValue)) {
    return {
      "list-style-position": normalizedValue,
    };
  }

  return null;
};

const expandTextDecorationShorthand = (value: string) => {
  const values = splitCssValue(value);
  if (values.length !== 1) return null;

  const normalizedValue = values[0].toLowerCase();
  if (["none", "underline", "overline", "line-through"].includes(normalizedValue)) {
    return {
      "text-decoration-line": normalizedValue,
    };
  }

  return null;
};

const normalizeDeclarations = (
  declarations: Declaration[]
): NormalizedDeclarations => {
  const style: CSSProperties = {};
  const preservedDeclarations: Declaration[] = [];

  declarations.forEach((declaration) => {
    if (declaration.prop === "margin" || declaration.prop === "padding") {
      const expanded = expandBoxShorthand(
        declaration.prop,
        declaration.value
      );

      if (expanded) {
        Object.assign(style, expanded);
      } else {
        style[declaration.prop] = declaration.value;
        preservedDeclarations.push(declaration);
      }
      return;
    }

    const expandedBorder = expandBorderShorthand(
      declaration.prop,
      declaration.value
    );
    if (expandedBorder) {
      Object.assign(style, expandedBorder.expanded);
      if (!expandedBorder.canConvert) {
        preservedDeclarations.push(declaration);
      }
      return;
    }

    if (declaration.prop === "border-color") {
      const expanded = expandBorderColorShorthand(declaration.value);
      if (expanded) {
        Object.assign(style, expanded);
      } else {
        style[declaration.prop] = declaration.value;
        preservedDeclarations.push(declaration);
      }
      return;
    }

    if (declaration.prop === "background") {
      const expanded = expandBackgroundShorthand(declaration.value);
      if (expanded) {
        Object.assign(style, expanded);
      } else {
        style[declaration.prop] = declaration.value;
        preservedDeclarations.push(declaration);
      }
      return;
    }

    if (declaration.prop === "font") {
      const expanded = expandFontShorthand(declaration.value);
      if (expanded) {
        Object.assign(style, expanded);
      } else {
        style[declaration.prop] = declaration.value;
        preservedDeclarations.push(declaration);
      }
      return;
    }

    if (declaration.prop === "transition") {
      const expanded = expandTransitionShorthand(declaration.value);
      if (expanded) {
        Object.assign(style, expanded);
      } else {
        style[declaration.prop] = declaration.value;
        preservedDeclarations.push(declaration);
      }
      return;
    }

    if (declaration.prop === "list-style") {
      const expanded = expandListStyleShorthand(declaration.value);
      if (expanded) {
        Object.assign(style, expanded);
      } else {
        style[declaration.prop] = declaration.value;
        preservedDeclarations.push(declaration);
      }
      return;
    }

    if (declaration.prop === "text-decoration") {
      const expanded = expandTextDecorationShorthand(declaration.value);
      if (expanded) {
        Object.assign(style, expanded);
      } else {
        style[declaration.prop] = declaration.value;
        preservedDeclarations.push(declaration);
      }
      return;
    }

    style[declaration.prop] = declaration.value;
  });

  return { style, preservedDeclarations };
};

export const cssToJson = (css: string): { [index: string]: string }[] => {
  const json: CSSJson = {};
  // Remove comments and normalize whitespace
  css = css
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove CSS comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim(); // Remove leading/trailing whitespace

  // Process each CSS rule
  const regex = /([^{]+){([^}]+)}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(css)) !== null) {
    const selector = match[1].trim();
    const style: CSSProperties = {};

    // Process declarations
    const declarations = match[2].split(";");
    declarations.forEach((declaration: string) => {
      const parts = declaration.split(":");
      if (parts.length === 2) {
        const property = parts[0].trim();
        const value = parts[1].trim();

        if (property && value) {
          style[property] = value;
        }
      }
    });

    // Only add non-empty style objects
    if (Object.keys(style).length > 0) {
      json[selector] = style;
    }
  }
  const result = [];
  for (const className in json) {
    const obj: { [index: string]: string } = {};
    obj[className] = convertAttributes(json[className]).join(" ");
    result.push(obj);
  }
  return result;
};

export const cssToTailwindRules = (
  css: string,
  mode: ConversionMode = "tokens"
) => {
  const rules: RuleConversion[] = [];
  const preservedRules: PreservedRule[] = [];
  const unsupported: ConversionIssue[] = [];
  const warnings: ConversionIssue[] = [];
  const leftovers: string[] = [];
  const warnedAtRules = new Set<string>();

  let root: postcss.Root;
  try {
    root = postcss.parse(css);
  } catch (error) {
    warnings.push({
      selector: "CSS",
      category: "unsupported-value",
      message:
        error instanceof Error
          ? `PostCSS could not parse this stylesheet: ${error.message}`
          : "PostCSS could not parse this stylesheet.",
    });
    preservedRules.push({
      selector: "CSS",
      category: "unsupported-value",
      message:
        error instanceof Error
          ? `PostCSS could not parse this stylesheet: ${error.message}`
          : "PostCSS could not parse this stylesheet.",
      css,
      atRules: [],
    });
    return { rules, preservedRules, unsupported, warnings, leftoverCss: css };
  }

  root.walkAtRules((atRule) => {
    if (atRule.name !== "media" && atRule.nodes?.some((node) => node.type === "rule")) {
      const selector = atRuleToString(atRule);
      const category = unsupportedAtRuleCategory([selector]);
      warnedAtRules.add(selector);
      warnings.push({
        selector,
        category,
        message: getUnsupportedMessage({
          category,
          fallbackMessage:
            "This at-rule is preserved for review because only simple media queries can become Tailwind variants.",
        }),
      });
    }
  });

  const selectorsNeededByDescendants = new Set<string>();
  root.walkRules((rule: Rule) => {
    splitSelectorList(rule.selector).forEach((selector) => {
      const selectorAnalysis = analyzeSelector(selector);
      const descendantParts = getSimpleDescendantParts(
        selectorAnalysis.applySelector
      );

      descendantParts?.slice(0, -1).forEach((part) => {
        if (part.startsWith(".")) selectorsNeededByDescendants.add(part);
      });
    });
  });

  root.walkRules((rule: Rule) => {
    const ruleAtRules: string[] = [];
    let parent = rule.parent;

    while (parent?.type === "atrule") {
      ruleAtRules.unshift(atRuleToString(parent as AtRule));
      parent = parent.parent;
    }

    const variantPrefix = classPrefixForAtRules(ruleAtRules);
    const unsupportedAtRule = ruleAtRules.length > 0 && !variantPrefix;

    if (unsupportedAtRule) {
      const selector = ruleAtRules.join(" ");
      const category = unsupportedAtRuleCategory(ruleAtRules);
      if (!warnedAtRules.has(selector)) {
        warnedAtRules.add(selector);
        warnings.push({
          selector,
          category,
          message: getUnsupportedMessage({
            category,
            fallbackMessage:
              "This at-rule is preserved for review because it cannot become a Tailwind variant.",
          }),
        });
      }
    }

    rule.each((node) => {
      if (node.type !== "decl" && node.type !== "comment") {
        warnings.push({
          selector: rule.selector,
          category: "unsupported-value",
          message: `Nested ${node.type} nodes are preserved for review.`,
        });
      }
    });

    const sourceDeclarations = rule.nodes?.filter(
      (node): node is Declaration => node.type === "decl"
    ) ?? [];
    const { style, preservedDeclarations } =
      normalizeDeclarations(sourceDeclarations);

    if (Object.keys(style).length === 0) {
      splitSelectorList(rule.selector).forEach((selector) => {
        appendLeftover(leftovers, selector, sourceDeclarations, ruleAtRules);
      });
      return;
    }

    const declarationsResult = convertAttributesDetailed(style, { mode });
    const unsupportedDeclarations: Pick<Declaration, "prop" | "value">[] = [
      ...preservedDeclarations,
    ];

    declarationsResult.forEach((item) => {
      const sourceDeclaration = sourceDeclarations.find(
        (declaration) => declaration.prop === item.property
      );

      if (item.status === "unsupported" && sourceDeclaration) {
        unsupportedDeclarations.push(sourceDeclaration);
      } else if (item.status === "unsupported") {
        unsupportedDeclarations.push({
          prop: item.property,
          value: item.value,
        });
      }

      if (item.status === "unsupported") {
        splitSelectorList(rule.selector).forEach((selector) => {
          const category = classifyUnsupported({
            selector,
            property: item.property,
            value: item.value,
          });
          unsupported.push({
            selector,
            property: item.property,
            value: item.value,
            category,
            message: getUnsupportedMessage({
              property: item.property,
              value: item.value,
              category,
              fallbackMessage:
                item.message ?? "Unsupported CSS declaration.",
            }),
          });
        });
      }
    });

    splitSelectorList(rule.selector).forEach((selector) => {
      const selectorAnalysis = analyzeSelector(selector);
      const canApply = selectorAnalysis.canApply && !unsupportedAtRule;
      const preserveCategory = unsupportedAtRule
        ? unsupportedAtRuleCategory(ruleAtRules)
        : classifyUnsupported({
            selector,
            fallback: "complex-selector",
          });
      const preserveMessage = unsupportedAtRule
        ? getUnsupportedMessage({
            category: preserveCategory,
            fallbackMessage:
              "This media query is preserved for review because it does not match a default Tailwind breakpoint.",
          })
        : selectorAnalysis.warning
          ? canApply
            ? selectorAnalysis.warning
            : getUnsupportedMessage({
                category: preserveCategory,
                fallbackMessage: selectorAnalysis.warning,
              })
          : "This rule is preserved for review.";

      if (selectorAnalysis.warning) {
        warnings.push({
          selector,
          category: preserveCategory,
          message: preserveMessage,
        });
      }

      if (!canApply) {
        const css = appendLeftover(
          leftovers,
          selector,
          sourceDeclarations,
          ruleAtRules
        );
        if (css) {
          preservedRules.push({
            selector,
            category: preserveCategory,
            message: preserveMessage,
            css,
            atRules: ruleAtRules,
          });
        }
      } else {
        appendLeftover(leftovers, selector, unsupportedDeclarations, ruleAtRules);
      }

      const preserveOriginalClass =
        Boolean(selectorAnalysis.preserveOriginalClass) ||
        selectorsNeededByDescendants.has(selectorAnalysis.applySelector) ||
        !canApply ||
        unsupportedDeclarations.length > 0;
      const classNames = declarationsResult
        .filter((item) => canApply && item.className)
        .map((item) => {
          const className = `${variantPrefix}${selectorAnalysis.variantPrefix}${item.className}`;
          return {
            ...item,
            selector: selectorAnalysis.originalSelector,
            className,
          };
        });

      rules.push({
        selector: selectorAnalysis.applySelector,
        declarations: classNames,
        atRules: ruleAtRules,
        canApply,
        preserveOriginalClass,
        classes: canApply
          ? classNames.map((item) => item.className).join(" ")
          : "",
      });
    });
  });

  return {
    rules,
    preservedRules,
    unsupported,
    warnings,
    leftoverCss: leftovers.join("\n\n"),
  };
};

export const getClosestValue = (sizes: (string | number)[], value: number) => {
  return sizes.reduce(
    (prev: number, curr: string | number) => {
      const currNum = typeof curr === "string" ? parseFloat(curr) : curr;
      const prevNum = typeof prev === "string" ? parseFloat(prev) : prev;

      return Math.abs(currNum - value) < Math.abs(prevNum - value)
        ? currNum
        : prevNum;
    },
    typeof sizes[0] === "string" ? parseFloat(sizes[0]) : sizes[0]
  );
};

export const validValue = (value: string) => {
  return value.includes("px") || value.includes("rem") ? true : false;
};

const spacingClassPattern = /^((?:[\w-]+:)*)?(-?)([mp])([trbl]?)-(.+)$/;

const classForSpacing = (
  variantPrefix: string,
  negativePrefix: string,
  property: "m" | "p",
  direction: "" | "x" | "y" | "t" | "r" | "b" | "l",
  value: string
) => `${variantPrefix}${negativePrefix}${property}${direction}-${value}`;

const consolidateSpacingClasses = (classes: string[]) => {
  const result = [...classes];
  const groups = new Map<
    string,
    {
      variantPrefix: string;
      negativePrefix: string;
      property: "m" | "p";
      directions: Partial<Record<"t" | "r" | "b" | "l", { value: string; index: number }>>;
      hasShorthand: boolean;
    }
  >();

  classes.forEach((className, index) => {
    const match = className.match(spacingClassPattern);
    if (!match) return;

    const [, variantPrefix = "", negativePrefix, property, direction, value] =
      match as [
        string,
        string | undefined,
        string,
        "m" | "p",
        "" | "t" | "r" | "b" | "l",
        string,
      ];
    const key = `${variantPrefix}|${negativePrefix}|${property}`;
    const group = groups.get(key) ?? {
      variantPrefix,
      negativePrefix,
      property,
      directions: {},
      hasShorthand: false,
    };

    if (direction === "") {
      group.hasShorthand = true;
    } else {
      group.directions[direction] = { value, index };
    }

    groups.set(key, group);
  });

  groups.forEach((group) => {
    if (group.hasShorthand) return;

    const { t, r, b, l } = group.directions;
    const replacements: Array<{
      indices: number[];
      className: string;
      insertIndex: number;
    }> = [];

    if (t && r && b && l && t.value === r.value && t.value === b.value && t.value === l.value) {
      replacements.push({
        indices: [t.index, r.index, b.index, l.index],
        className: classForSpacing(
          group.variantPrefix,
          group.negativePrefix,
          group.property,
          "",
          t.value
        ),
        insertIndex: Math.min(t.index, r.index, b.index, l.index),
      });
    } else {
      if (t && b && t.value === b.value) {
        replacements.push({
          indices: [t.index, b.index],
          className: classForSpacing(
            group.variantPrefix,
            group.negativePrefix,
            group.property,
            "y",
            t.value
          ),
          insertIndex: Math.min(t.index, b.index),
        });
      }

      if (r && l && r.value === l.value) {
        replacements.push({
          indices: [r.index, l.index],
          className: classForSpacing(
            group.variantPrefix,
            group.negativePrefix,
            group.property,
            "x",
            r.value
          ),
          insertIndex: Math.min(r.index, l.index),
        });
      }
    }

    replacements.forEach(({ indices, className, insertIndex }) => {
      indices.forEach((index) => {
        result[index] = "";
      });
      result[insertIndex] = className;
    });
  });

  return result.filter(Boolean);
};

const normalizeClassList = (classes: string[]) =>
  consolidateSpacingClasses(Array.from(new Set(classes)));

interface ClassObject {
  [selector: string]:
    | string
    | {
        classes: string;
        preserveOriginalClass: boolean;
      };
}

export const parser = (html: string, classObjects: ClassObject[]) => {
  const sanitizedHtml = DOMPurify.sanitize(html);
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, "text/html");

  for (const classObject of classObjects) {
    for (const selector in classObject) {
      if (Object.hasOwn(classObject, selector)) {
        const classValue = classObject[selector];
        const tailwindClasses =
          typeof classValue === "string" ? classValue : classValue.classes;
        const preserveOriginalClass =
          typeof classValue === "string"
            ? false
            : classValue.preserveOriginalClass;
        // temporary fix because media queries aren't supported yet
        // need to refactor the css parsing first
        if (tailwindClasses !== "" && !/[@{}]/.test(selector)) {
          const elements = doc.querySelectorAll(selector);

          if (elements) {
            elements.forEach((element) => {
              if (selector.startsWith(".") && !preserveOriginalClass) {
                // Class-based selector: Replace specific class names
                const originalClasses = element.className.split(" ");
                const newClasses = originalClasses.map((cls) =>
                  cls === selector.substring(1) ? tailwindClasses : cls
                );
                element.className = normalizeClassList(newClasses).join(" ");
              } else {
                // Tag-based selectors add classes; preserved class selectors keep leftovers working.
                const currentClasses = element.className
                  .split(" ")
                  .filter(Boolean);
                const newClasses = tailwindClasses.split(" ").filter(Boolean);
                const mergedClasses = normalizeClassList([
                  ...currentClasses,
                  ...newClasses,
                ]);
                element.className = mergedClasses.join(" ");
              }
            });
          }
        }
      }
    }
  }

  return doc.documentElement.outerHTML;
};

const addLeftoverCss = (html: string, leftoverCss: string) => {
  if (!leftoverCss.trim()) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const style = doc.createElement("style");
  style.textContent = leftoverCss;
  doc.head.appendChild(style);

  return doc.documentElement.outerHTML;
};

export const convertHtmlCss = (
  html: string,
  css: string,
  mode: ConversionMode = "tokens"
): ConversionResult => {
  const { rules, preservedRules, unsupported, warnings, leftoverCss } =
    cssToTailwindRules(css, mode);
  const selectorClasses = rules
    .filter((rule) => rule.canApply)
    .reduce((classesBySelector, rule) => {
      const existing = classesBySelector.get(rule.selector);
      const classes = [
        ...(existing?.classes.split(" ").filter(Boolean) ?? []),
        ...rule.classes.split(" ").filter(Boolean),
      ];

      classesBySelector.set(rule.selector, {
        classes: normalizeClassList(classes).join(" "),
        preserveOriginalClass:
          Boolean(existing?.preserveOriginalClass) || rule.preserveOriginalClass,
      });

      return classesBySelector;
    }, new Map<string, { classes: string; preserveOriginalClass: boolean }>());
  const classObjects = Array.from(selectorClasses).map(([selector, value]) => ({
    [selector]: value,
  }));
  const convertedHtml = addLeftoverCss(parser(html, classObjects), leftoverCss);
  const convertedDeclarations = rules.flatMap((rule) => rule.declarations);
  const unsupportedDeclarations = unsupported.map((issue) => ({
    selector: issue.selector,
    property: issue.property ?? "",
    value: issue.value ?? "",
    className: "",
    status: "unsupported" as const,
    message: issue.message,
  }));
  const declarations = [...convertedDeclarations, ...unsupportedDeclarations];

  return {
    html: convertedHtml,
    rules,
    preservedRules,
    converted: declarations.filter((item) => item.status === "converted"),
    approximated: declarations.filter((item) => item.status === "approximated"),
    unsupported,
    warnings,
    leftoverCss,
  };
};
