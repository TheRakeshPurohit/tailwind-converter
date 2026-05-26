import { expect, test } from "vitest";
import { convertHtmlCss, cssToJson } from "../src/util/helper";
import { parser } from "../src/util/helper";
import {
  buildPreviewDoc,
  generatePreviewCss,
  sanitizePreviewCss,
  sanitizePreviewHtml,
} from "../src/util/preview";
import { css_beautify, html_beautify } from "js-beautify";

test("adds 1 + 2 to equal 3", () => {
  const html = `<html lang="en">
<body>
  <div class="main">
    <h2>Welcome to Tailwind Converter!</h2>
    <p>Edit/paste HTML here and CSS into
      the editor below
    </p>
  </div>
</body>
</html>`;
  const css = `body {
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
  const cssAttributes = cssToJson(
    css_beautify(css, {
      indent_size: 2,
      max_preserve_newlines: 0,
    })
  );
  const tailwind = html_beautify(
    parser(
      html.replace(/=(?:')([^']+)'/g, '="$1"'), // converts single quotes to double
      cssAttributes
    ),
    {
      indent_size: 2,
      extra_liners: [],
      wrap_line_length: 70,
      max_preserve_newlines: 0,
    }
  );

  const result = `<html>
<head></head>
<body class="m-4 p-4">
  <div class="text-center">
    <h2 class="text-3xl mb-2 text-blue-700">Welcome to Tailwind
      Converter!</h2>
    <p>Edit/paste HTML here and CSS into
      the editor below
    </p>
  </div>
</body>
</html>`;

  expect(tailwind).toBe(result);
});

test("converts unitless zero spacing on body", () => {
  const result = convertHtmlCss(
    `<html><body><main>Content</main></body></html>`,
    `body { margin: 0; padding: 0; }`
  );

  expect(result.html).toContain('<body class="m-0 p-0">');
  expect(result.converted).toEqual([
    {
      selector: "body",
      property: "margin",
      value: "0",
      className: "m-0",
      status: "converted",
    },
    {
      selector: "body",
      property: "padding",
      value: "0",
      className: "p-0",
      status: "converted",
    },
  ]);
});

test.each([
  ["color", "text-[color:blue]"],
  ["background-color", "bg-[color:blue]"],
  ["border-color", "border-[color:blue]"],
  ["border-top-color", "border-t-[color:blue]"],
  ["border-right-color", "border-r-[color:blue]"],
  ["border-bottom-color", "border-b-[color:blue]"],
  ["border-left-color", "border-l-[color:blue]"],
  ["text-decoration-color", "decoration-[color:blue]"],
  ["outline-color", "outline-[color:blue]"],
  ["accent-color", "accent-[color:blue]"],
  ["caret-color", "caret-[color:blue]"],
  ["fill", "fill-[color:blue]"],
  ["stroke", "stroke-[color:blue]"],
])("uses color type hints for exact named %s", (property, className) => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { ${property}: blue; }`,
    "exact"
  );

  expect(result.html).toContain(`class="${className}"`);
  expect(result.converted).toContainEqual({
    selector: ".card",
    property,
    value: "blue",
    className,
    status: "converted",
  });
});

test.each([
  ["blue", "text-[color:blue]"],
  ["#123456", "text-[#123456]"],
  ["rgb(1, 2, 3)", "text-[rgb(1\\,_2\\,_3)]"],
  ["hsl(210 50% 40%)", "text-[hsl(210_50%_40%)]"],
  ["oklch(60% 0.2 250)", "text-[oklch(60%_0.2_250)]"],
  ["transparent", "text-transparent"],
  ["currentColor", "text-current"],
  ["inherit", "text-inherit"],
  ["white", "text-white"],
])("keeps exact text color value %s", (value, className) => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { color: ${value}; }`,
    "exact"
  );

  expect(result.html).toContain(`class="${className}"`);
  expect(result.converted).toContainEqual({
    selector: ".card",
    property: "color",
    value,
    className,
    status: "converted",
  });
});

test("converts standalone keyword font weight", () => {
  const result = convertHtmlCss(
    `<html><body><h1 class="logo">MySite</h1></body></html>`,
    `.logo { font-size: 24px; font-weight: bold; }`
  );

  expect(result.html).toContain('class="text-2xl font-bold"');
  expect(result.converted).toContainEqual(
    expect.objectContaining({
      selector: ".logo",
      property: "font-weight",
      value: "bold",
      className: "font-bold",
      status: "converted",
    })
  );
});

test("reports unsupported declarations instead of dropping them silently", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { animation: pulse 1s infinite; margin: 17px; }`
  );

  expect(result.html).toContain('class="card m-4"');
  expect(result.html).toContain("<style>.card {");
  expect(result.leftoverCss).toContain("animation: pulse 1s infinite;");
  expect(result.unsupported).toEqual([
    {
      selector: ".card",
      property: "animation",
      value: "pulse 1s infinite",
      category: "animation",
      message:
        "Animations are preserved. animation and @keyframes conversion is not implemented yet.",
    },
  ]);
  expect(result.approximated).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".card",
        property: "margin",
        value: "17px",
        className: "m-4",
      }),
    ])
  );
});

test("maps box-shadow to the nearest Tailwind shadow token", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); }`
  );

  expect(result.html).toContain('class="shadow-lg"');
  expect(result.leftoverCss).toBe("");
  expect(result.approximated).toEqual([
    expect.objectContaining({
      selector: ".card",
      property: "box-shadow",
      value: "0 10px 15px rgba(0, 0, 0, 0.1)",
      className: "shadow-lg",
      message: "Mapped to the nearest Tailwind design token.",
    }),
  ]);
});

test("can prefer exact arbitrary box-shadow values", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { box-shadow: 0 7px 22px rgba(0, 0, 0, 0.16); }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="shadow-[0_7px_22px_rgba(0\\,_0\\,_0\\,_0.16)]"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual([
    expect.objectContaining({
      selector: ".card",
      property: "box-shadow",
      className: "shadow-[0_7px_22px_rgba(0\\,_0\\,_0\\,_0.16)]",
    }),
  ]);
});

test("converts empty box-shadow to shadow-none", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { box-shadow: none; }`
  );

  expect(result.html).toContain('class="shadow-none"');
  expect(result.leftoverCss).toBe("");
});

test.each(["tokens", "exact"] as const)(
  "converts pill border radius to rounded-full in %s mode",
  (mode) => {
    const result = convertHtmlCss(
      `<html><body><span class="pill">New</span></body></html>`,
      `.pill { border-radius: 9999px; }`,
      mode
    );

    expect(result.html).toContain('class="rounded-full"');
    expect(result.leftoverCss).toBe("");
    expect(result.converted).toEqual([
      expect.objectContaining({
        selector: ".pill",
        property: "border-radius",
        value: "9999px",
        className: "rounded-full",
      }),
    ]);
  }
);

test("does not collapse non-pill large border radius values to rounded-full", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { border-radius: 64px; }`
  );

  expect(result.html).toContain('class="rounded-3xl"');
});

test("converts common grid template columns and rows", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout">Grid</section></body></html>`,
    `.layout {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(2, minmax(0, 1fr));
    }`
  );

  expect(result.html).toContain('class="grid grid-cols-3 grid-rows-2"');
  expect(result.leftoverCss).toBe("");
  expect(result.approximated).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".layout",
        property: "grid-template-columns",
        className: "grid-cols-3",
      }),
      expect.objectContaining({
        selector: ".layout",
        property: "grid-template-rows",
        className: "grid-rows-2",
      }),
    ])
  );
});

test("converts none and subgrid grid templates", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout">Grid</section></body></html>`,
    `.layout {
      grid-template-columns: subgrid;
      grid-template-rows: none;
    }`
  );

  expect(result.html).toContain('class="grid-cols-subgrid grid-rows-none"');
  expect(result.leftoverCss).toBe("");
});

test("converts common grid placement shorthands", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout"><div class="item">Item</div></section></body></html>`,
    `.item {
      grid-column: span 2 / span 2;
      grid-row: 1 / 3;
    }`
  );

  expect(result.html).toContain(
    'class="col-span-2 row-start-1 row-end-3"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".item",
        property: "grid-column",
        value: "span 2 / span 2",
        className: "col-span-2",
      }),
      expect.objectContaining({
        selector: ".item",
        property: "grid-row",
        value: "1 / 3",
        className: "row-start-1 row-end-3",
      }),
    ])
  );
});

test("converts grid placement longhands", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout"><div class="item">Item</div></section></body></html>`,
    `.item {
      grid-column-start: 2;
      grid-column-end: 4;
      grid-row-start: auto;
    }`
  );

  expect(result.html).toContain(
    'class="col-start-2 col-end-4 row-start-auto"'
  );
  expect(result.leftoverCss).toBe("");
});

test("preserves complex grid placement in token mode", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout"><div class="item">Item</div></section></body></html>`,
    `.item { grid-column: main-start / main-end; }`
  );

  expect(result.html).toContain('class="item"');
  expect(result.leftoverCss).toContain("grid-column: main-start / main-end;");
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".item",
      property: "grid-column",
      value: "main-start / main-end",
      category: "grid-placement",
      message:
        "Grid placement is preserved. Mapping spans and line numbers to Tailwind is not implemented yet.",
    }),
  ]);
});

test("can prefer exact arbitrary grid placement values", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout"><div class="item">Item</div></section></body></html>`,
    `.item { grid-column: main-start / main-end; grid-row-start: content; }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="col-[main-start_/_main-end] row-start-[content]"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".item",
        property: "grid-column",
        className: "col-[main-start_/_main-end]",
      }),
      expect.objectContaining({
        selector: ".item",
        property: "grid-row-start",
        className: "row-start-[content]",
      }),
    ])
  );
});

test("preserves complex grid templates in token mode", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout">Grid</section></body></html>`,
    `.layout { grid-template-columns: 200px 1fr; }`
  );

  expect(result.html).toContain('class="layout"');
  expect(result.leftoverCss).toContain("grid-template-columns: 200px 1fr;");
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".layout",
      property: "grid-template-columns",
      value: "200px 1fr",
      category: "unsupported-property",
      message:
        "This grid template is preserved because it could not be mapped to a supported Tailwind grid utility.",
    }),
  ]);
});

test("can prefer exact arbitrary grid templates", () => {
  const result = convertHtmlCss(
    `<html><body><section class="layout">Grid</section></body></html>`,
    `.layout { grid-template-columns: 200px 1fr; }`,
    "exact"
  );

  expect(result.html).toContain('class="grid-cols-[200px_1fr]"');
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual([
    expect.objectContaining({
      selector: ".layout",
      property: "grid-template-columns",
      className: "grid-cols-[200px_1fr]",
    }),
  ]);
});

test("converts transition properties and timing functions", () => {
  const result = convertHtmlCss(
    `<html><body><button class="cta">Buy</button></body></html>`,
    `.cta {
      transition-property: color, background-color, border-color;
      transition-duration: 200ms;
      transition-delay: 75ms;
      transition-timing-function: ease-out;
    }`
  );

  expect(result.html).toContain(
    'class="transition-colors duration-200 delay-75 ease-out"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.approximated).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".cta",
        property: "transition-property",
        className: "transition-colors",
      }),
      expect.objectContaining({
        selector: ".cta",
        property: "transition-timing-function",
        className: "ease-out",
      }),
    ])
  );
});

test("expands conservative transition shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><button class="cta">Buy</button></body></html>`,
    `.cta { transition: opacity 300ms ease-in-out 75ms; }`
  );

  expect(result.html).toContain(
    'class="transition-opacity ease-in-out duration-300 delay-75"'
  );
  expect(result.leftoverCss).toBe("");
});

test("expands transition shorthand with parser-preserved timing functions", () => {
  const result = convertHtmlCss(
    `<html><body><button class="cta">Buy</button></body></html>`,
    `.cta { transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1) 75ms; }`
  );

  expect(result.html).toContain(
    'class="transition-opacity ease-in-out duration-200 delay-75"'
  );
  expect(result.leftoverCss).toBe("");
});

test("preserves unsupported multi-transition shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><button class="cta">Buy</button></body></html>`,
    `.cta { transition: opacity 200ms ease, transform 300ms linear; }`
  );

  expect(result.html).toContain('class="cta"');
  expect(result.leftoverCss).toContain(
    "transition: opacity 200ms ease, transform 300ms linear;"
  );
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".cta",
      property: "transition",
      value: "opacity 200ms ease, transform 300ms linear",
    }),
  ]);
});

test("can prefer exact arbitrary transition values", () => {
  const result = convertHtmlCss(
    `<html><body><button class="cta">Buy</button></body></html>`,
    `.cta {
      transition-property: width;
      transition-timing-function: ease;
    }`,
    "exact"
  );

  expect(result.html).toContain('class="transition-[width] ease-[ease]"');
  expect(result.leftoverCss).toBe("");
});

test("converts compound transform functions into multiple utilities", () => {
  const result = convertHtmlCss(
    `<html><body><div class="badge">New</div></body></html>`,
    `.badge { transform: translateX(12px) translateY(-50%) rotate(6deg) scale(1.05); }`
  );

  expect(result.html).toContain(
    'class="translate-x-3 -translate-y-1/2 rotate-6 scale-105"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.approximated).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".badge",
        property: "transform",
        className: "translate-x-3",
      }),
      expect.objectContaining({
        selector: ".badge",
        property: "transform",
        className: "-translate-y-1/2",
      }),
      expect.objectContaining({
        selector: ".badge",
        property: "transform",
        className: "rotate-6",
      }),
      expect.objectContaining({
        selector: ".badge",
        property: "transform",
        className: "scale-105",
      }),
    ])
  );
});

test("preserves unsupported transform functions", () => {
  const result = convertHtmlCss(
    `<html><body><div class="badge">New</div></body></html>`,
    `.badge { transform: matrix(1, 0, 0, 1, 10, 20); }`
  );

  expect(result.html).toContain('class="badge"');
  expect(result.leftoverCss).toContain("transform: matrix(1, 0, 0, 1, 10, 20);");
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".badge",
      property: "transform",
      value: "matrix(1, 0, 0, 1, 10, 20)",
    }),
  ]);
});

test("converts compound filter functions into multiple utilities", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { filter: blur(8px) brightness(1.1) contrast(95%) saturate(1.5) hue-rotate(15deg) grayscale(100%); }`
  );

  expect(result.html).toContain(
    'class="blur brightness-110 contrast-100 saturate-150 hue-rotate-15 grayscale"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.approximated).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ property: "filter", className: "blur" }),
      expect.objectContaining({ property: "filter", className: "brightness-110" }),
      expect.objectContaining({ property: "filter", className: "contrast-100" }),
      expect.objectContaining({ property: "filter", className: "saturate-150" }),
      expect.objectContaining({ property: "filter", className: "hue-rotate-15" }),
      expect.objectContaining({ property: "filter", className: "grayscale" }),
    ])
  );
});

test("converts compound backdrop-filter functions into backdrop utilities", () => {
  const result = convertHtmlCss(
    `<html><body><div class="panel">Panel</div></body></html>`,
    `.panel { backdrop-filter: blur(12px) brightness(.9) contrast(1.25); }`
  );

  expect(result.html).toContain(
    'class="backdrop-blur-md backdrop-brightness-90 backdrop-contrast-125"'
  );
  expect(result.leftoverCss).toBe("");
});

test("preserves unsupported filter functions", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { filter: blur(8px) drop-shadow(0 4px 8px rgb(0 0 0 / 0.2)); }`
  );

  expect(result.html).toContain('class="card"');
  expect(result.leftoverCss).toContain(
    "filter: blur(8px) drop-shadow(0 4px 8px rgb(0 0 0 / 0.2));"
  );
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".card",
      property: "filter",
      value: "blur(8px) drop-shadow(0 4px 8px rgb(0 0 0 / 0.2))",
      category: "filter-effect",
      message:
        "This filter chain is preserved because one or more filter functions cannot be mapped to supported Tailwind filter utilities.",
    }),
  ]);
});

test("can prefer exact arbitrary values for supported declarations", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { margin: 17px; min-height: 220px; color: #123456; }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="m-[17px] min-h-[220px] text-[#123456]"'
  );
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".card",
        property: "margin",
        className: "m-[17px]",
      }),
      expect.objectContaining({
        selector: ".card",
        property: "min-height",
        className: "min-h-[220px]",
      }),
      expect.objectContaining({
        selector: ".card",
        property: "color",
        className: "text-[#123456]",
      }),
    ])
  );
});

test("uses exact spacing values while preserving native zero and auto tokens", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { margin: 80px auto; padding: 0 40px; }`,
    "exact"
  );

  expect(result.html).toContain('class="my-[80px] mx-auto py-0 px-[40px]"');
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".hero",
        property: "margin-top",
        className: "mt-[80px]",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "margin-right",
        className: "mr-auto",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "padding-top",
        className: "pt-0",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "padding-right",
        className: "pr-[40px]",
      }),
    ])
  );
});

test("converts safe pseudo-classes to Tailwind variants", () => {
  const result = convertHtmlCss(
    `<html><body><button class="cta">Buy</button></body></html>`,
    `.cta:hover { color: red; }`
  );

  expect(result.html).toContain('class="hover:text-red-600"');
  expect(result.leftoverCss).toBe("");
  expect(result.warnings).toEqual([]);
});

test("warns before flattening complex selectors", () => {
  const result = convertHtmlCss(
    `<html><body><article class="card"><h2>Title</h2></article></body></html>`,
    `.card > h2 { color: red; }`
  );

  expect(result.warnings).toEqual([
    {
      selector: ".card > h2",
      category: "relationship-based",
      message:
        "This selector targets related elements. Converting it safely would require changing HTML structure.",
    },
  ]);
  expect(result.leftoverCss).toContain(".card > h2");
});

test("applies simple descendant selectors to matched elements", () => {
  const result = convertHtmlCss(
    `<html><body><div class="hero-content"><p>Lead copy</p></div></body></html>`,
    `.hero-content p { color: red; margin-bottom: 1rem; }`
  );

  expect(result.html).toContain('<p class="text-red-600 mb-4">Lead copy</p>');
  expect(result.leftoverCss).toBe("");
  expect([...result.converted, ...result.approximated]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".hero-content p",
        property: "color",
        className: "text-red-600",
      }),
      expect.objectContaining({
        selector: ".hero-content p",
        property: "margin-bottom",
        className: "mb-4",
      }),
    ])
  );
  expect(result.warnings).toEqual([
    {
      selector: ".hero-content p",
      category: "relationship-based",
      message:
        "Descendant selector was applied to currently matched elements. Review if this relationship is dynamic.",
    },
  ]);
});

test("splits safe comma selectors", () => {
  const result = convertHtmlCss(
    `<html><body><h1>One</h1><h2>Two</h2></body></html>`,
    `h1, h2 { margin-bottom: 1rem; }`
  );

  expect(result.html).toContain('<h1 class="mb-4">One</h1>');
  expect(result.html).toContain('<h2 class="mb-4">Two</h2>');
  expect(result.leftoverCss).toBe("");
});

test("expands margin shorthand into longhand Tailwind classes", () => {
  const result = convertHtmlCss(
    `<html><body><div class="box">Box</div></body></html>`,
    `.box { margin: 1rem 2rem 3rem 4rem; }`
  );

  expect(result.html).toContain('class="mt-4 mr-8 mb-12 ml-16"');
  expect(result.leftoverCss).toBe("");
});

test("consolidates two-value padding shorthand into axis Tailwind classes", () => {
  const result = convertHtmlCss(
    `<html><body><section class="panel">Panel</section></body></html>`,
    `.panel { padding: 8px 16px; }`
  );

  expect(result.html).toContain('class="py-2 px-4"');
  expect(result.leftoverCss).toBe("");
});

test("consolidates auto margin shorthand pieces", () => {
  const result = convertHtmlCss(
    `<html><body><div class="box">Box</div></body></html>`,
    `.box { margin: auto 2rem; }`
  );

  expect(result.html).toContain('class="my-auto mx-8"');
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".box",
        property: "margin-top",
        value: "auto",
        className: "mt-auto",
      }),
      expect.objectContaining({
        selector: ".box",
        property: "margin-bottom",
        value: "auto",
        className: "mb-auto",
      }),
    ])
  );
});

test("keeps css functions intact when expanding exact spacing shorthands", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero {
      margin: calc(100% - 2rem) auto;
      padding: clamp(1rem, 2vw, 2rem) 24px;
    }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="my-[calc(100%_-_2rem)] mx-auto py-[clamp(1rem\\,_2vw\\,_2rem)] px-[24px]"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".hero",
        property: "margin-top",
        className: "mt-[calc(100%_-_2rem)]",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "margin-right",
        className: "mr-auto",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "padding-top",
        className: "pt-[clamp(1rem\\,_2vw\\,_2rem)]",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "padding-right",
        className: "pr-[24px]",
      }),
    ])
  );
});

test("expands border shorthand into width style and color classes", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { border: 1px solid red; }`
  );

  expect(result.html).toContain('class="border border-solid border-red-600"');
  expect(result.leftoverCss).toBe("");
});

test("expands border side shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { border-top: 2px dashed blue; }`
  );

  expect(result.html).toContain(
    'class="border-t-2 border-dashed border-t-blue-700"'
  );
  expect(result.leftoverCss).toBe("");
});

test("keeps functional border widths intact in exact border shorthands", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { border-top: calc(1px + 1px) solid red; }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="border-t-[calc(1px_+_1px)] border-solid border-t-[color:red]"'
  );
  expect(result.leftoverCss).toBe("");
});

test("expands border-color shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { border-color: red blue; }`
  );

  expect(result.html).toContain(
    'class="border-t-red-600 border-r-blue-700 border-b-red-600 border-l-blue-700"'
  );
  expect(result.leftoverCss).toBe("");
});

test("preserves multi-value border radius in token mode", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { border-radius: 8px 12px; }`
  );

  expect(result.html).toContain('class="card"');
  expect(result.leftoverCss).toContain("border-radius: 8px 12px;");
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".card",
      property: "border-radius",
      value: "8px 12px",
    }),
  ]);
});

test("converts multi-value border radius in exact mode", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { border-radius: 8px 12px; }`,
    "exact"
  );

  expect(result.html).toContain('class="rounded-[8px_12px]"');
  expect(result.leftoverCss).toBe("");
});

test("converts color-only background shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><div class="hero">Hero</div></body></html>`,
    `.hero { background: #ffffff; }`
  );

  expect(result.html).toContain('class="bg-white"');
  expect(result.leftoverCss).toBe("");
});

test("expands compound background shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><div class="hero">Hero</div></body></html>`,
    `.hero { background: url("/hero.png") center / cover no-repeat; padding: 1rem; }`
  );

  expect(result.html).toContain(
    'class="hero bg-no-repeat bg-center bg-cover p-4"'
  );
  expect(result.leftoverCss).toContain(
    'background-image: url("/hero.png");'
  );
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".hero",
      property: "background-image",
      value: 'url("/hero.png")',
    }),
  ]);
});

test("expands background shorthand color repeat position size and attachment", () => {
  const result = convertHtmlCss(
    `<html><body><div class="hero">Hero</div></body></html>`,
    `.hero { background: #111827 url(#hero) right top / contain repeat-x fixed; }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="bg-[#111827] bg-[url(#hero)] bg-repeat-x bg-fixed bg-right-top bg-contain"'
  );
  expect(result.leftoverCss).toBe("");
});

test("preserves layered compound background shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><div class="hero">Hero</div></body></html>`,
    `.hero { background: linear-gradient(to right, red, blue), url(#hero) center / cover no-repeat; padding: 1rem; }`
  );

  expect(result.html).toContain('class="hero p-4"');
  expect(result.leftoverCss).toContain(
    "background: linear-gradient(to right, red, blue), url(#hero) center / cover no-repeat;"
  );
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".hero",
      property: "background",
    }),
  ]);
});

test("converts simple linear gradients in token mode", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background: linear-gradient(to right, red, blue); padding: 1rem; }`
  );

  expect(result.html).toContain(
    'class="bg-linear-to-r from-red-600 to-blue-700 p-4"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.approximated).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".hero",
        property: "background-image",
        value: "linear-gradient(to right, red, blue)",
        className: "bg-linear-to-r",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "background-image",
        value: "linear-gradient(to right, red, blue)",
        className: "from-red-600",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "background-image",
        value: "linear-gradient(to right, red, blue)",
        className: "to-blue-700",
      }),
    ])
  );
});

test("converts simple three-stop linear gradients in token mode", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background-image: linear-gradient(to bottom right, #2563eb, white, #0f766e); }`
  );

  expect(result.html).toContain(
    'class="bg-linear-to-br from-blue-600 via-white to-teal-700"'
  );
  expect(result.leftoverCss).toBe("");
});

test("preserves complex gradients in token mode", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background: linear-gradient(135deg, red, blue); padding: 1rem; }`
  );

  expect(result.html).toContain('class="hero p-4"');
  expect(result.leftoverCss).toContain(
    "background-image: linear-gradient(135deg, red, blue);"
  );
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".hero",
      property: "background-image",
      value: "linear-gradient(135deg, red, blue)",
    }),
  ]);
});

test("can prefer exact arbitrary gradient stop colors", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background: linear-gradient(to right, #123456, rgb(1, 2, 3)); }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="bg-linear-to-r from-[#123456] to-[rgb(1\\,_2\\,_3)]"'
  );
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".hero",
        property: "background-image",
        value: "linear-gradient(to right, #123456, rgb(1, 2, 3))",
        className: "from-[#123456]",
      }),
      expect.objectContaining({
        selector: ".hero",
        property: "background-image",
        value: "linear-gradient(to right, #123456, rgb(1, 2, 3))",
        className: "to-[rgb(1\\,_2\\,_3)]",
      }),
    ])
  );
});

test("can prefer exact arbitrary background shorthand urls", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background: url(#hero); }`,
    "exact"
  );

  expect(result.html).toContain('class="bg-[url(#hero)]"');
  expect(result.leftoverCss).toBe("");
});

test("preserves background images in token mode", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background-image: url("/hero.png"); padding: 1rem; }`
  );

  expect(result.html).toContain('class="hero p-4"');
  expect(result.leftoverCss).toContain('background-image: url("/hero.png");');
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".hero",
      property: "background-image",
      value: 'url("/hero.png")',
      category: "background-image",
      message:
        "Background images and gradients are preserved in token mode. Use Exact mode to emit an arbitrary background image utility.",
    }),
  ]);
});

test("can prefer exact arbitrary background image urls", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background-image: url(#hero); }`,
    "exact"
  );

  expect(result.html).toContain('class="bg-[url(#hero)]"');
  expect(result.leftoverCss).toBe("");
  expect(result.converted).toEqual([
    expect.objectContaining({
      selector: ".hero",
      property: "background-image",
      className: "bg-[url(#hero)]",
    }),
  ]);
});

test("can prefer exact arbitrary background gradients", () => {
  const result = convertHtmlCss(
    `<html><body><section class="hero">Hero</section></body></html>`,
    `.hero { background-image: linear-gradient(135deg, red, blue); }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="bg-[linear-gradient(135deg\\,_red\\,_blue)]"'
  );
  expect(result.leftoverCss).toBe("");
});

test("expands font shorthand into typography classes", () => {
  const result = convertHtmlCss(
    `<html><body><p class="lead">Lead</p></body></html>`,
    `.lead { font: italic 700 16px/1.5 sans-serif; }`
  );

  expect(result.html).toContain(
    'class="italic font-bold text-base leading-normal font-sans"'
  );
  expect(result.leftoverCss).toBe("");
});

test("expands rem font shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><p class="lead">Lead</p></body></html>`,
    `.lead { font: 1.25rem serif; }`
  );

  expect(result.html).toContain('class="text-xl font-serif"');
  expect(result.leftoverCss).toBe("");
});

test("expands font shorthand with spaced line-height slash", () => {
  const result = convertHtmlCss(
    `<html><body><p class="lead">Lead</p></body></html>`,
    `.lead { font: italic 700 16px / 1.5 "Inter", sans-serif; }`
  );

  expect(result.html).toContain(
    'class="italic font-bold text-base leading-normal font-sans"'
  );
  expect(result.leftoverCss).toBe("");
});

test("preserves ambiguous font shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><p class="lead">Lead</p></body></html>`,
    `.lead { font: caption; }`
  );

  expect(result.html).toContain('class="lead"');
  expect(result.leftoverCss).toContain("font: caption;");
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".lead",
      property: "font",
      value: "caption",
    }),
  ]);
});

test("converts default Tailwind media queries to responsive prefixes", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `@media (min-width: 768px) { .card { padding: 2rem; } }`
  );

  expect(result.html).toContain('class="md:p-8"');
  expect(result.leftoverCss).toBe("");
  expect(result.rules[0]).toEqual(
    expect.objectContaining({
      selector: ".card",
      classes: "md:p-8",
      atRules: ["@media (min-width: 768px)"],
      canApply: true,
    })
  );
});

test("preserves unsupported media queries as leftover CSS", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `@media (max-width: 700px) { .card { padding: 2rem; } }`
  );

  expect(result.html).toContain('class="card"');
  expect(result.leftoverCss).toContain("@media (max-width: 700px)");
  expect(result.leftoverCss).toContain("padding: 2rem;");
  expect(result.warnings).toEqual([
    {
      selector: "@media (max-width: 700px)",
      category: "media-query",
      message:
        "This at-rule is preserved because it does not match a default Tailwind responsive breakpoint.",
    },
  ]);
});

test("keeps original classes needed by preserved max-width media queries", () => {
  const result = convertHtmlCss(
    `<html><body><div class="stats-grid"><div>Revenue</div><div>Users</div><div>Storage</div></div></body></html>`,
    `.stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }`
  );

  expect(result.html).toContain(
    'class="stats-grid grid grid-cols-3 gap-5"'
  );
  expect(result.leftoverCss).toContain("@media (max-width: 768px)");
  expect(result.leftoverCss).toContain(".stats-grid {");
  expect(result.leftoverCss).toContain("grid-template-columns: 1fr;");
  expect(result.rules).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".stats-grid",
        preserveOriginalClass: true,
      }),
    ])
  );
});

test("classifies preserved keyframes separately from media queries", () => {
  const result = convertHtmlCss(
    `<html><body><div class="spinner"></div></body></html>`,
    `.spinner { animation: spin 1s linear infinite; }
     @keyframes spin { to { transform: rotate(360deg); } }`
  );

  expect(result.leftoverCss).toContain("@keyframes spin");
  expect(result.warnings).toContainEqual({
    selector: "@keyframes spin",
    category: "keyframes",
    message:
      "Keyframes are preserved. animation and @keyframes conversion is not implemented yet.",
  });
  expect(result.warnings).not.toContainEqual(
    expect.objectContaining({
      selector: "@keyframes spin",
      category: "media-query",
    })
  );
  expect(result.preservedRules).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: "to",
        category: "keyframes",
      }),
    ])
  );
});

test("classifies preserved container queries separately from media queries", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `@container (min-width: 32rem) { .card { padding: 2rem; } }`
  );

  expect(result.leftoverCss).toContain("@container (min-width: 32rem)");
  expect(result.warnings).toContainEqual({
    selector: "@container (min-width: 32rem)",
    category: "container-query",
    message:
      "Container queries are preserved. Tailwind container query conversion is not implemented yet.",
  });
  expect(result.preservedRules).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".card",
        category: "container-query",
      }),
    ])
  );
});

test("parses declaration values that break simple colon splitting", () => {
  const result = convertHtmlCss(
    `<html><body><div class="hero">Hero</div></body></html>`,
    `.hero { background-image: url("https://example.com/a:b.png"); padding: 1rem; }`
  );

  expect(result.html).toContain('class="hero p-4"');
  expect(result.leftoverCss).toContain(
    'background-image: url("https://example.com/a:b.png");'
  );
});

test("classifies css variable values", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { color: var(--brand-color); }`
  );

  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".card",
      property: "color",
      value: "var(--brand-color)",
      category: "css-variable",
      message:
        "CSS variable values are preserved. Tailwind theme token mapping is not implemented yet.",
    }),
  ]);
});

test("classifies pseudo-element selectors", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card::before { content: ""; }`
  );

  expect(result.warnings).toEqual([
    expect.objectContaining({
      selector: ".card::before",
      category: "pseudo-element",
      message:
        "Pseudo-elements are preserved because generated elements cannot be represented as classes on the original element.",
    }),
  ]);
  expect(result.leftoverCss).toContain('.card::before {\n  content: "";');
  expect(result.preservedRules).toEqual([
    expect.objectContaining({
      selector: ".card::before",
      category: "pseudo-element",
      css: expect.stringContaining('content: "";'),
    }),
  ]);
  expect(result.converted).toEqual([]);
  expect(result.approximated).toEqual([]);
  expect(result.html).not.toContain("undefined");
  expect(result.rules[0]).toEqual(
    expect.objectContaining({
      selector: ".card::before",
      classes: "",
      declarations: [],
      canApply: false,
    })
  );
});

test("preserves pseudo-elements without leaking generated content classes", () => {
  const result = convertHtmlCss(
    `<html><body><button class="cta">Buy</button></body></html>`,
    `.cta::before { content: "→"; margin-right: 0.5rem; }
     .cta::after { content: ""; display: block; }`
  );

  expect(result.leftoverCss).toContain(".cta::before");
  expect(result.leftoverCss).toContain('content: "→";');
  expect(result.leftoverCss).toContain(".cta::after");
  expect(result.leftoverCss).toContain('content: "";');
  expect(result.preservedRules).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".cta::before",
        category: "pseudo-element",
        css: expect.stringContaining('content: "→";'),
      }),
      expect.objectContaining({
        selector: ".cta::after",
        category: "pseudo-element",
        css: expect.stringContaining('content: "";'),
      }),
    ])
  );
  expect(result.warnings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".cta::before",
        category: "pseudo-element",
      }),
      expect.objectContaining({
        selector: ".cta::after",
        category: "pseudo-element",
      }),
    ])
  );
  expect(result.converted).toEqual([]);
  expect(result.approximated).toEqual([]);
  expect(result.html).toContain('class="cta"');
  expect(result.html).not.toContain("undefined");
});

test("sanitizes preview html by removing scripts and event handlers", () => {
  const result = sanitizePreviewHtml(
    `<div onclick="alert('x')">Safe</div><script>alert("x")</script>`
  );

  expect(result).toContain("<div>Safe</div>");
  expect(result).not.toContain("<script");
  expect(result).not.toContain("onclick");
});

test("sanitizes preview documents without removing body classes", () => {
  const result = sanitizePreviewHtml(
    `<html><head></head><body class="bg-[#f4f6f8]"><main onclick="alert('x')">Dashboard</main><script>alert("x")</script></body></html>`
  );

  expect(result).toContain('<body class="bg-[#f4f6f8]">');
  expect(result).toContain("<main>Dashboard</main>");
  expect(result).not.toContain("<script");
  expect(result).not.toContain("onclick");
});

test("escapes style closing tags in preview css", () => {
  const result = sanitizePreviewCss(
    `body { color: red; }</style><script>alert("x")</script>`
  );

  expect(result).toContain("<\\/style>");
  expect(result).toContain("<script>");
});

test("preserves full document body classes in converted preview docs", () => {
  const result = buildPreviewDoc(
    `<html><head></head><body class="bg-[#f4f6f8]"><main>Dashboard</main></body></html>`,
    `.bg-\\[\\#f4f6f8\\]{background-color: #f4f6f8;}`
  );

  expect(result).toContain('<body class="bg-[#f4f6f8]">');
  expect(result).toContain(
    ".bg-\\[\\#f4f6f8\\]{background-color: #f4f6f8;}"
  );
  expect(result).not.toContain("<body><html>");
});

test("places generated preview css before preserved converted css", () => {
  const result = buildPreviewDoc(
    `<html><head><style>@media (max-width: 768px) {.stats-grid {grid-template-columns: 1fr;}}</style></head><body><div class="stats-grid grid grid-cols-3"></div></body></html>`,
    `.grid-cols-3{grid-template-columns: repeat(3, minmax(0, 1fr));}`
  );

  expect(result.indexOf(".grid-cols-3")).toBeLessThan(
    result.indexOf("@media (max-width: 768px)")
  );
});

test("preview border reset keeps border-bottom utilities from drawing full borders", () => {
  const result = generatePreviewCss(
    `<div class="flex border-b border-solid border-b-gray-200"></div>`
  );

  expect(result).toContain(
    "*,::before,::after{border-width:0;border-style:solid;}"
  );
  expect(result.indexOf("border-width:0")).toBeLessThan(
    result.indexOf(".border-b{border-bottom-width: 1px;}")
  );
  expect(result).toContain(".border-solid{border-style: solid;}");
  expect(result).toContain(
    ".border-b-gray-200{border-bottom-color: #e5e7eb;}"
  );
});

test("generates scriptless preview css for common Tailwind classes", () => {
  const result = generatePreviewCss(
    `<div class="m-4 mx-auto py-2 px-4 p-[17px] text-red-600 text-[#123456] text-[color:blue] text-[17px] bg-white border border-b border-b-[3px] border-t-[color:blue] border-solid rounded-md rounded-[7px] shadow-lg shadow-[0_7px_22px_rgba(0\\,_0\\,_0\\,_0.16)] hover:text-blue-700 md:p-8"></div>`
  );

  expect(result).toContain(".m-4{margin: 1rem;}");
  expect(result).toContain(
    ".mx-auto{margin-left: auto;margin-right: auto;}"
  );
  expect(result).toContain(
    ".py-2{padding-top: 0.5rem;padding-bottom: 0.5rem;}"
  );
  expect(result).toContain(
    ".px-4{padding-left: 1rem;padding-right: 1rem;}"
  );
  expect(result).toContain(".p-\\[17px\\]{padding: 17px;}");
  expect(result).toContain(".text-red-600{color: #dc2626;}");
  expect(result).toContain(".text-\\[\\#123456\\]{color: #123456;}");
  expect(result).toContain(".text-\\[color\\:blue\\]{color: blue;}");
  expect(result).toContain(".text-\\[17px\\]{font-size: 17px;}");
  expect(result).toContain(".bg-white{background-color: #ffffff;}");
  expect(result).toContain(".border{border-width: 1px;}");
  expect(result).toContain(".border-b{border-bottom-width: 1px;}");
  expect(result).toContain(
    ".border-b-\\[3px\\]{border-bottom-width: 3px;}"
  );
  expect(result).toContain(
    ".border-t-\\[color\\:blue\\]{border-top-color: blue;}"
  );
  expect(result).toContain(".rounded-md{border-radius: 0.375rem;}");
  expect(result).toContain(".rounded-\\[7px\\]{border-radius: 7px;}");
  expect(result).toContain(
    ".shadow-lg{box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);}"
  );
  expect(result).toContain(
    ".shadow-\\[0_7px_22px_rgba\\(0\\\\\\,_0\\\\\\,_0\\\\\\,_0\\.16\\)\\]{box-shadow: 0 7px 22px rgba(0, 0, 0, 0.16);}"
  );
  expect(result).toContain(".hover\\:text-blue-700:hover{color: #1d4ed8;}");
  expect(result).toContain(
    "@media (min-width: 768px){.md\\:p-8{padding: 2rem;}}"
  );
});

test.each([
  ["text-[color:blue]", "color: blue"],
  ["bg-[color:blue]", "background-color: blue"],
  ["border-[color:blue]", "border-color: blue"],
  ["border-t-[color:blue]", "border-top-color: blue"],
  ["border-r-[color:blue]", "border-right-color: blue"],
  ["border-b-[color:blue]", "border-bottom-color: blue"],
  ["border-l-[color:blue]", "border-left-color: blue"],
  ["decoration-[color:blue]", "text-decoration-color: blue"],
  ["outline-[color:blue]", "outline-color: blue"],
  ["accent-[color:blue]", "accent-color: blue"],
  ["caret-[color:blue]", "caret-color: blue"],
  ["fill-[color:blue]", "fill: blue"],
  ["stroke-[color:blue]", "stroke: blue"],
])("generates scriptless preview css for exact %s", (className, declaration) => {
  const result = generatePreviewCss(`<div class="${className}"></div>`);

  expect(result).toContain(`${declaration};`);
});

test.each([
  ["text-current", "color: currentColor"],
  ["bg-transparent", "background-color: transparent"],
  ["border-inherit", "border-color: inherit"],
  ["decoration-white", "text-decoration-color: #ffffff"],
  ["outline-black", "outline-color: #000000"],
  ["accent-current", "accent-color: currentColor"],
  ["caret-transparent", "caret-color: transparent"],
  ["fill-white", "fill: #ffffff"],
  ["stroke-black", "stroke: #000000"],
])("generates scriptless preview css for token color %s", (className, declaration) => {
  const result = generatePreviewCss(`<div class="${className}"></div>`);

  expect(result).toContain(`${declaration};`);
});

test("generates scriptless preview css for transition utilities", () => {
  const result = generatePreviewCss(
    `<button class="transition-colors duration-200 delay-75 ease-out transition-[width] ease-[ease]"></button>`
  );

  expect(result).toContain(
    ".transition-colors{transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;}"
  );
  expect(result).toContain(".duration-200{transition-duration: 200ms;}");
  expect(result).toContain(".delay-75{transition-delay: 75ms;}");
  expect(result).toContain(
    ".ease-out{transition-timing-function: cubic-bezier(0, 0, 0.2, 1);}"
  );
  expect(result).toContain(
    ".transition-\\[width\\]{transition-property: width;}"
  );
  expect(result).toContain(".ease-\\[ease\\]{transition-timing-function: ease;}");
});

test("generates scriptless preview css for arbitrary background images", () => {
  const result = generatePreviewCss(
    `<section class="bg-[url(#hero)] bg-[linear-gradient(to_right\\,_red\\,_blue)]"></section>`
  );

  expect(result).toContain(
    ".bg-\\[url\\(\\#hero\\)\\]{background-image: url(#hero);}"
  );
  expect(result).toContain(
    ".bg-\\[linear-gradient\\(to_right\\\\\\,_red\\\\\\,_blue\\)\\]{background-image: linear-gradient(to right, red, blue);}"
  );
});

test("generates scriptless preview css for gradient utilities", () => {
  const result = generatePreviewCss(
    `<section class="bg-linear-to-r from-red-600 via-[color:white] to-[rgb(1\\,_2\\,_3)]"></section>`
  );

  expect(result).toContain(
    ".bg-linear-to-r{background-image: linear-gradient(to right, var(--tw-gradient-stops, var(--tw-gradient-from), var(--tw-gradient-to)));}"
  );
  expect(result).toContain(
    ".from-red-600{--tw-gradient-from: #dc2626;--tw-gradient-to: transparent;--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);}"
  );
  expect(result).toContain(
    ".via-\\[color\\:white\\]{--tw-gradient-stops: var(--tw-gradient-from), white, var(--tw-gradient-to);}"
  );
  expect(result).toContain(
    ".to-\\[rgb\\(1\\\\\\,_2\\\\\\,_3\\)\\]{--tw-gradient-to: rgb(1, 2, 3);}"
  );
});

test("generates scriptless preview css for background placement utilities", () => {
  const result = generatePreviewCss(
    `<section class="bg-fixed bg-repeat-x bg-right-top bg-contain"></section>`
  );

  expect(result).toContain(".bg-fixed{background-attachment: fixed;}");
  expect(result).toContain(".bg-repeat-x{background-repeat: repeat-x;}");
  expect(result).toContain(
    ".bg-right-top{background-position: right top;}"
  );
  expect(result).toContain(".bg-contain{background-size: contain;}");
});

test("generates scriptless preview css for grid placement utilities", () => {
  const result = generatePreviewCss(
    `<section class="col-auto row-auto col-span-2 row-span-full col-start-1 col-end-3 row-start-auto row-end-4 col-[main-start_/_main-end] row-start-[content]"></section>`
  );

  expect(result).toContain(".col-auto{grid-column: auto;}");
  expect(result).toContain(".row-auto{grid-row: auto;}");
  expect(result).toContain(
    ".col-span-2{grid-column: span 2 / span 2;}"
  );
  expect(result).toContain(".row-span-full{grid-row: 1 / -1;}");
  expect(result).toContain(".col-start-1{grid-column-start: 1;}");
  expect(result).toContain(".col-end-3{grid-column-end: 3;}");
  expect(result).toContain(".row-start-auto{grid-row-start: auto;}");
  expect(result).toContain(".row-end-4{grid-row-end: 4;}");
  expect(result).toContain(
    ".col-\\[main-start_\\/_main-end\\]{grid-column: main-start / main-end;}"
  );
  expect(result).toContain(
    ".row-start-\\[content\\]{grid-row-start: content;}"
  );
});

test("generates scriptless preview css for common converter layout utilities", () => {
  const result = generatePreviewCss(
    `<section class="flex-1 basis-1/2 min-w-0 min-h-screen max-w-6xl h-full top-4 -left-2 z-10 order-first overflow-hidden list-none no-underline cursor-pointer appearance-none pointer-events-none select-none resize-y tracking-wide opacity-75"></section>`
  );

  expect(result).toContain(".flex-1{flex: 1 1 0%;}");
  expect(result).toContain(".basis-1\\/2{flex-basis: 50%;}");
  expect(result).toContain(".min-w-0{min-width: 0rem;}");
  expect(result).toContain(".min-h-screen{min-height: 100vh;}");
  expect(result).toContain(".max-w-6xl{max-width: 72rem;}");
  expect(result).toContain(".h-full{height: 100%;}");
  expect(result).toContain(".top-4{top: 1rem;}");
  expect(result).toContain(".-left-2{left: -0.5rem;}");
  expect(result).toContain(".z-10{z-index: 10;}");
  expect(result).toContain(".order-first{order: -9999;}");
  expect(result).toContain(".overflow-hidden{overflow: hidden;}");
  expect(result).toContain(".list-none{list-style-type: none;}");
  expect(result).toContain(".no-underline{text-decoration-line: none;}");
  expect(result).toContain(".cursor-pointer{cursor: pointer;}");
  expect(result).toContain(".appearance-none{appearance: none;}");
  expect(result).toContain(".pointer-events-none{pointer-events: none;}");
  expect(result).toContain(".select-none{user-select: none;}");
  expect(result).toContain(".resize-y{resize: vertical;}");
  expect(result).toContain(".tracking-wide{letter-spacing: 0.025em;}");
  expect(result).toContain(".opacity-75{opacity: 0.75;}");
});

test("generates scriptless preview css for broader converter utilities", () => {
  const result = generatePreviewCss(
    `<section class="float-left clear-both isolate justify-items-center self-end place-content-between object-right-top bg-clip-padding bg-origin-content border-hidden outline outline-2 outline-offset-4 decoration-wavy decoration-2 underline-offset-4 overscroll-y-contain scroll-smooth snap-start snap-always touch-pan-x will-change-transform border-collapse table-fixed auto-rows-fr auto-cols-min grid-flow-row-dense origin-top-left mix-blend-multiply bg-blend-overlay columns-3 scroll-mt-6 scroll-pl-4 stroke-2"></section>`
  );

  expect(result).toContain(".float-left{float: left;}");
  expect(result).toContain(".clear-both{clear: both;}");
  expect(result).toContain(".isolate{isolation: isolate;}");
  expect(result).toContain(".justify-items-center{justify-items: center;}");
  expect(result).toContain(".self-end{align-self: flex-end;}");
  expect(result).toContain(
    ".place-content-between{place-content: space-between;}"
  );
  expect(result).toContain(".object-right-top{object-position: right top;}");
  expect(result).toContain(".bg-clip-padding{background-clip: padding-box;}");
  expect(result).toContain(
    ".bg-origin-content{background-origin: content-box;}"
  );
  expect(result).toContain(".border-hidden{border-style: hidden;}");
  expect(result).toContain(".outline{outline-style: solid;}");
  expect(result).toContain(".outline-2{outline-width: 2px;}");
  expect(result).toContain(".outline-offset-4{outline-offset: 4px;}");
  expect(result).toContain(".decoration-wavy{text-decoration-style: wavy;}");
  expect(result).toContain(".decoration-2{text-decoration-thickness: 2px;}");
  expect(result).toContain(
    ".underline-offset-4{text-underline-offset: 4px;}"
  );
  expect(result).toContain(
    ".overscroll-y-contain{overscroll-behavior-y: contain;}"
  );
  expect(result).toContain(".scroll-smooth{scroll-behavior: smooth;}");
  expect(result).toContain(".snap-start{scroll-snap-align: start;}");
  expect(result).toContain(".snap-always{scroll-snap-stop: always;}");
  expect(result).toContain(".touch-pan-x{touch-action: pan-x;}");
  expect(result).toContain(".will-change-transform{will-change: transform;}");
  expect(result).toContain(".border-collapse{border-collapse: collapse;}");
  expect(result).toContain(".table-fixed{table-layout: fixed;}");
  expect(result).toContain(".auto-rows-fr{grid-auto-rows: minmax(0, 1fr);}");
  expect(result).toContain(".auto-cols-min{grid-auto-columns: min-content;}");
  expect(result).toContain(".grid-flow-row-dense{grid-auto-flow: row dense;}");
  expect(result).toContain(".origin-top-left{transform-origin: top left;}");
  expect(result).toContain(".mix-blend-multiply{mix-blend-mode: multiply;}");
  expect(result).toContain(".bg-blend-overlay{background-blend-mode: overlay;}");
  expect(result).toContain(".columns-3{columns: 3;}");
  expect(result).toContain(".scroll-mt-6{scroll-margin-top: 1.5rem;}");
  expect(result).toContain(".scroll-pl-4{scroll-padding-left: 1rem;}");
  expect(result).toContain(".stroke-2{stroke-width: 2;}");
});

test("generates scriptless preview css for exact axis and positioning utilities", () => {
  const result = generatePreviewCss(
    `<section class="mx-[17px] py-[9px] gap-x-[11px] basis-[33%] top-[3px] z-[12] opacity-[.67] tracking-[0.02em] indent-[2rem]"></section>`
  );

  expect(result).toContain(
    ".mx-\\[17px\\]{margin-inline: 17px;}"
  );
  expect(result).toContain(
    ".py-\\[9px\\]{padding-block: 9px;}"
  );
  expect(result).toContain(
    ".gap-x-\\[11px\\]{column-gap: 11px;}"
  );
  expect(result).toContain(".basis-\\[33\\%\\]{flex-basis: 33%;}");
  expect(result).toContain(".top-\\[3px\\]{top: 3px;}");
  expect(result).toContain(".z-\\[12\\]{z-index: 12;}");
  expect(result).toContain(".opacity-\\[\\.67\\]{opacity: .67;}");
  expect(result).toContain(
    ".tracking-\\[0\\.02em\\]{letter-spacing: 0.02em;}"
  );
  expect(result).toContain(".indent-\\[2rem\\]{text-indent: 2rem;}");
});

test("generates composable scriptless preview css for transform utilities", () => {
  const result = generatePreviewCss(
    `<section class="translate-x-3 -translate-y-1/2 rotate-6 scale-105 skew-x-3"></section>`
  );

  expect(result).toContain("--tw-translate-x: 0.75rem;");
  expect(result).toContain("--tw-translate-y: -50%;");
  expect(result).toContain("--tw-rotate: 6deg;");
  expect(result).toContain("--tw-scale-x: 1.05;--tw-scale-y: 1.05;");
  expect(result).toContain("--tw-skew-x: 3deg;");
  expect(result).toContain(
    "transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0)) rotate(var(--tw-rotate, 0))"
  );
});

test("generates composable scriptless preview css for filter utilities", () => {
  const result = generatePreviewCss(
    `<section class="blur brightness-110 contrast-95 saturate-150 hue-rotate-15 grayscale backdrop-blur-md backdrop-brightness-90 backdrop-contrast-125"></section>`
  );

  expect(result).toContain("--tw-blur: 8px;");
  expect(result).toContain("--tw-brightness: 1.1;");
  expect(result).toContain("--tw-contrast: 0.95;");
  expect(result).toContain("--tw-saturate: 1.5;");
  expect(result).toContain("--tw-hue-rotate: 15deg;");
  expect(result).toContain("--tw-grayscale: 1;");
  expect(result).toContain(
    "filter: blur(var(--tw-blur, 0)) brightness(var(--tw-brightness, 1))"
  );
  expect(result).toContain("--tw-backdrop-blur: 12px;");
  expect(result).toContain("--tw-backdrop-brightness: 0.9;");
  expect(result).toContain("--tw-backdrop-contrast: 1.25;");
  expect(result).toContain(
    "backdrop-filter: blur(var(--tw-backdrop-blur, 0)) brightness(var(--tw-backdrop-brightness, 1))"
  );
});
