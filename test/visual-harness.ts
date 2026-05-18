import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { chromium, type Browser, type Page } from "playwright";
import { convertHtmlCss } from "../src/util/helper";
import {
  generatePreviewCss,
  sanitizePreviewCss,
  sanitizePreviewHtml,
} from "../src/util/preview";
import type { ConversionMode } from "../src/util/converter";

export type VisualViewport = {
  name: string;
  width: number;
  height: number;
};

export type VisualRegressionCase = {
  name: string;
  html: string;
  css: string;
  mode?: ConversionMode;
  viewports?: VisualViewport[];
  maxMismatchRatio?: number;
};

export type VisualRegressionResult = {
  name: string;
  viewport: VisualViewport;
  mismatchPixels: number;
  totalPixels: number;
  mismatchRatio: number;
  accuracy: number;
  artifacts: {
    original: string;
    converted: string;
    diff: string;
  };
};

const defaultViewports: VisualViewport[] = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const artifactRoot = path.join(process.cwd(), "test-artifacts", "visual");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const escapeAttributeValue = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const isSafeBodyAttribute = (name: string) =>
  name === "class" ||
  name === "id" ||
  name.startsWith("data-") ||
  name.startsWith("aria-");

const serializeAttributes = (element: Element) =>
  Array.from(element.attributes)
    .filter((attribute) => isSafeBodyAttribute(attribute.name.toLowerCase()))
    .map(
      (attribute) =>
        `${attribute.name}="${escapeAttributeValue(attribute.value)}"`
    )
    .join(" ");

const extractDocumentParts = (html: string) => {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const bodyAttributes = serializeAttributes(parsed.body);

  return {
    head: sanitizePreviewHtml(parsed.head.innerHTML),
    bodyAttributes: bodyAttributes ? ` ${bodyAttributes}` : "",
    body: sanitizePreviewHtml(parsed.body.innerHTML),
  };
};

const buildOriginalDocument = (html: string, css: string) => {
  const { head, body, bodyAttributes } = extractDocumentParts(html);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${head}
<style>${sanitizePreviewCss(css)}</style>
</head>
<body${bodyAttributes}>${body}</body>
</html>`;
};

const buildConvertedDocument = (html: string) => {
  const { head, body, bodyAttributes } = extractDocumentParts(html);
  const generatedCss = sanitizePreviewCss(generatePreviewCss(html));

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${head}
<style>${generatedCss}</style>
</head>
<body${bodyAttributes}>${body}</body>
</html>`;
};

const pageScreenshot = async (
  page: Page,
  html: string,
  viewport: VisualViewport
) => {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts?.ready);

  return page.screenshot({
    fullPage: false,
    animations: "disabled",
    caret: "hide",
  });
};

const comparePngs = (original: Buffer, converted: Buffer) => {
  const originalPng = PNG.sync.read(original);
  const convertedPng = PNG.sync.read(converted);
  const width = Math.min(originalPng.width, convertedPng.width);
  const height = Math.min(originalPng.height, convertedPng.height);
  const diff = new PNG({ width, height });
  const mismatchPixels = pixelmatch(
    originalPng.data,
    convertedPng.data,
    diff.data,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: false,
    }
  );
  const totalPixels = width * height;

  return {
    diff: PNG.sync.write(diff),
    mismatchPixels,
    totalPixels,
    mismatchRatio: mismatchPixels / totalPixels,
  };
};

export const runVisualRegressionCase = async (
  browser: Browser,
  visualCase: VisualRegressionCase
) => {
  const conversion = convertHtmlCss(
    visualCase.html,
    visualCase.css,
    visualCase.mode ?? "tokens"
  );
  const originalDocument = buildOriginalDocument(visualCase.html, visualCase.css);
  const convertedDocument = buildConvertedDocument(conversion.html);
  const viewports = visualCase.viewports ?? defaultViewports;
  const page = await browser.newPage({
    deviceScaleFactor: 1,
  });

  try {
    const results: VisualRegressionResult[] = [];

    for (const viewport of viewports) {
      const original = await pageScreenshot(page, originalDocument, viewport);
      const converted = await pageScreenshot(page, convertedDocument, viewport);
      const comparison = comparePngs(original, converted);
      const caseSlug = slugify(visualCase.name);
      const viewportSlug = slugify(viewport.name);
      const artifactDir = path.join(artifactRoot, caseSlug);
      const artifacts = {
        original: path.join(artifactDir, `${viewportSlug}-original.png`),
        converted: path.join(artifactDir, `${viewportSlug}-converted.png`),
        diff: path.join(artifactDir, `${viewportSlug}-diff.png`),
      };

      await mkdir(artifactDir, { recursive: true });
      await Promise.all([
        writeFile(artifacts.original, original),
        writeFile(artifacts.converted, converted),
        writeFile(artifacts.diff, comparison.diff),
      ]);

      results.push({
        name: visualCase.name,
        viewport,
        mismatchPixels: comparison.mismatchPixels,
        totalPixels: comparison.totalPixels,
        mismatchRatio: comparison.mismatchRatio,
        accuracy: 1 - comparison.mismatchRatio,
        artifacts,
      });
    }

    return {
      conversion,
      results,
    };
  } finally {
    await page.close();
  }
};

export const launchVisualRegressionBrowser = () =>
  chromium.launch({
    headless: true,
  });
