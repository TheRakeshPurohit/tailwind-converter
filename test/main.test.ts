import { expect, test } from "vitest";
import { convertHtmlCss, cssToJson } from "../src/util/helper";
import { parser } from "../src/util/helper";
import {
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
      category: "unsupported-property",
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

test("can prefer exact arbitrary values for supported declarations", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { margin: 17px; color: #123456; }`,
    "exact"
  );

  expect(result.html).toContain('class="m-[17px] text-[#123456]"');
  expect(result.converted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".card",
        property: "margin",
        className: "m-[17px]",
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

test("preserves compound background shorthand", () => {
  const result = convertHtmlCss(
    `<html><body><div class="hero">Hero</div></body></html>`,
    `.hero { background: url("/hero.png") center / cover no-repeat; padding: 1rem; }`
  );

  expect(result.html).toContain('class="hero p-4"');
  expect(result.leftoverCss).toContain(
    'background: url("/hero.png") center / cover no-repeat;'
  );
  expect(result.unsupported).toEqual([
    expect.objectContaining({
      selector: ".hero",
      property: "background",
      value: 'url("/hero.png") center / cover no-repeat',
    }),
  ]);
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
      category: "unsupported-property",
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
    `.hero { background-image: linear-gradient(to right, red, blue); }`,
    "exact"
  );

  expect(result.html).toContain(
    'class="bg-[linear-gradient(to_right\\,_red\\,_blue)]"'
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

test("escapes style closing tags in preview css", () => {
  const result = sanitizePreviewCss(
    `body { color: red; }</style><script>alert("x")</script>`
  );

  expect(result).toContain("<\\/style>");
  expect(result).toContain("<script>");
});

test("generates scriptless preview css for common Tailwind classes", () => {
  const result = generatePreviewCss(
    `<div class="m-4 p-[17px] text-red-600 bg-white border border-solid shadow-lg shadow-[0_7px_22px_rgba(0\\,_0\\,_0\\,_0.16)] hover:text-blue-700 md:p-8"></div>`
  );

  expect(result).toContain(".m-4{margin: 1rem;}");
  expect(result).toContain(".p-\\[17px\\]{padding: 17px;}");
  expect(result).toContain(".text-red-600{color: #dc2626;}");
  expect(result).toContain(".bg-white{background-color: #ffffff;}");
  expect(result).toContain(".border{border-width: 1px;}");
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
