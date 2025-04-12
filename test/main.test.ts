import { expect, test } from "vitest";
import { cssToJson } from "../src/util/helper";
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
