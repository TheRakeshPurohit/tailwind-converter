import { describe, expect, test } from "vitest";
import { convertHtmlCss } from "../src/util/helper";
import { conversionFixtures } from "./fixtures/conversion-fixtures";
import { corpusFixtures } from "./fixtures/corpus/corpus-fixtures";

describe("conversion fixtures", () => {
  test.each([...conversionFixtures, ...corpusFixtures])("$name", ({ html, css, mode, expected }) => {
    const result = convertHtmlCss(html, css, mode);

    expected.htmlIncludes?.forEach((snippet) => {
      expect(result.html).toContain(snippet);
    });

    expected.htmlExcludes?.forEach((snippet) => {
      expect(result.html).not.toContain(snippet);
    });

    expected.leftoverIncludes?.forEach((snippet) => {
      expect(result.leftoverCss).toContain(snippet);
    });

    expected.leftoverExcludes?.forEach((snippet) => {
      expect(result.leftoverCss).not.toContain(snippet);
    });

    expected.converted?.forEach((declaration) => {
      expect(result.converted).toEqual(
        expect.arrayContaining([expect.objectContaining(declaration)])
      );
    });

    expected.approximated?.forEach((declaration) => {
      expect(result.approximated).toEqual(
        expect.arrayContaining([expect.objectContaining(declaration)])
      );
    });

    expected.unsupported?.forEach((issue) => {
      expect(result.unsupported).toEqual(
        expect.arrayContaining([expect.objectContaining(issue)])
      );
    });

    expected.preservedRules?.forEach((rule) => {
      expect(result.preservedRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            selector: rule.selector,
            category: rule.category,
            css: rule.css ? expect.stringContaining(rule.css) : expect.any(String),
          }),
        ])
      );
    });

    expected.warnings?.forEach((warning) => {
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.objectContaining(warning)])
      );
    });
  });
});
