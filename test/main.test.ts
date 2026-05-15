import { expect, test } from "vitest";
import { convertHtmlCss, cssToJson } from "../src/util/helper";
import { parser } from "../src/util/helper";
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

test("reports unsupported declarations instead of dropping them silently", () => {
  const result = convertHtmlCss(
    `<html><body><div class="card">Card</div></body></html>`,
    `.card { box-shadow: 0 1px 3px black; margin: 17px; }`
  );

  expect(result.html).toContain('class="card m-4"');
  expect(result.html).toContain("<style>.card {");
  expect(result.leftoverCss).toContain("box-shadow: 0 1px 3px black;");
  expect(result.unsupported).toEqual([
    {
      selector: ".card",
      property: "box-shadow",
      value: "0 1px 3px black",
      message: "No Tailwind utility mapping exists yet for this declaration.",
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
      message:
        "Complex selectors are reported for review because moving them inline can change behavior.",
    },
  ]);
  expect(result.leftoverCss).toContain(".card > h2");
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

test("expands two-value padding shorthand into longhand Tailwind classes", () => {
  const result = convertHtmlCss(
    `<html><body><section class="panel">Panel</section></body></html>`,
    `.panel { padding: 8px 16px; }`
  );

  expect(result.html).toContain('class="pt-2 pr-4 pb-2 pl-4"');
  expect(result.leftoverCss).toBe("");
});

test("preserves unsupported expanded shorthand pieces", () => {
  const result = convertHtmlCss(
    `<html><body><div class="box">Box</div></body></html>`,
    `.box { margin: auto 2rem; }`
  );

  expect(result.html).toContain('class="box mr-8 ml-8"');
  expect(result.leftoverCss).toContain("margin-top: auto;");
  expect(result.leftoverCss).toContain("margin-bottom: auto;");
  expect(result.unsupported).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        selector: ".box",
        property: "margin-top",
        value: "auto",
      }),
      expect.objectContaining({
        selector: ".box",
        property: "margin-bottom",
        value: "auto",
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
      message:
        "This media query is preserved for review because it does not match a default Tailwind breakpoint.",
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
