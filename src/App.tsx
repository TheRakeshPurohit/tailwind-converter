import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { css_beautify, html_beautify } from "js-beautify";
import {
  convertHtmlCss,
  initialHTML,
  initialCSS,
} from "./util/helper";
import type { ConversionResult } from "./util/helper";
import { Header } from "./components/header";
import {
  ClipboardList,
  Code2,
  Copy,
  Eye,
  FileWarning,
  Monitor,
  Smartphone,
  Tablet,
  Undo,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { track } from "@vercel/analytics";
import type { ConversionMode } from "./util/converter";
import { sanitizePreviewCss, sanitizePreviewHtml } from "./util/preview";

type OutputView = "html" | "review" | "css" | "preview";
type ReviewStatus = "all" | "converted" | "approximated" | "unsupported" | "warnings";
type PreviewViewport = "desktop" | "tablet" | "mobile";
type PreviewMode = "split" | "original" | "converted";

function App() {
  const [htmlText, setHtmlText] = useState("");
  const [cssText, setCssText] = useState("");
  const [tailwindText, setTailwindText] = useState("");
  const [conversionMode, setConversionMode] =
    useState<ConversionMode>("tokens");
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);
  const [outputView, setOutputView] = useState<OutputView>("html");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("all");
  const [reviewSelector, setReviewSelector] = useState("all");
  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>("desktop");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("split");
  const [lastConversionInput, setLastConversionInput] = useState({
    html: "",
    css: "",
  });
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("vite-ui-theme");
    return savedTheme ? savedTheme : "dark";
  });

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme === "dark" ? "light" : "dark");
  };
  const firstSync = useRef(false);

  const maxHeight = {
    maxHeight: "calc(100% - 5.25rem)",
  };
  const copyToClipboard = () => {
    toast("Copied to clipboard!", {
      duration: 2000,
    });
    navigator.clipboard.writeText(tailwindText);
  };
  const copyLeftoverCss = () => {
    if (!conversionResult?.leftoverCss) return;
    toast("Copied leftover CSS!", {
      duration: 2000,
    });
    navigator.clipboard.writeText(conversionResult.leftoverCss);
  };

  const reset = () => {
    setHtmlText(initialHTML);
    setCssText(initialCSS);
  };

  const codepenOriginal = JSON.stringify({
    title: "Original HTML/CSS",
    html: htmlText,
    css: cssText,
  });
  const codepenTailwind = JSON.stringify({
    title: "Tailwind version",
    html: tailwindText,
    head: '<script src="https://cdn.tailwindcss.com"></script>',
  });
  const reviewCount = conversionResult
    ? conversionResult.unsupported.length + conversionResult.warnings.length
    : 0;
  const convertedCount = conversionResult
    ? conversionResult.converted.length + conversionResult.approximated.length
    : 0;
  const totalDeclarationCount = conversionResult
    ? conversionResult.converted.length +
      conversionResult.approximated.length +
      conversionResult.unsupported.length
    : 0;
  const confidencePercent =
    totalDeclarationCount > 0 && conversionResult
      ? Math.round(
          (conversionResult.converted.length / totalDeclarationCount) * 100
        )
      : 0;
  const confidenceLabel =
    confidencePercent >= 80
      ? "High"
      : confidencePercent >= 50
        ? "Mixed"
        : "Review";
  const selectorOptions = conversionResult
    ? Array.from(
        new Set([
          ...conversionResult.rules.map((rule) => rule.selector),
          ...conversionResult.unsupported.map((issue) => issue.selector),
          ...conversionResult.warnings.map((issue) => issue.selector),
          ...conversionResult.converted
            .map((item) => item.selector)
            .filter((selector): selector is string => Boolean(selector)),
          ...conversionResult.approximated
            .map((item) => item.selector)
            .filter((selector): selector is string => Boolean(selector)),
        ])
      )
    : [];
  const selectorMatches = (selector?: string) =>
    reviewSelector === "all" || selector === reviewSelector;
  const filteredRules =
    conversionResult?.rules.filter((rule) => selectorMatches(rule.selector)) ??
    [];
  const filteredConverted =
    conversionResult?.converted.filter((item) => selectorMatches(item.selector)) ??
    [];
  const filteredApproximated =
    conversionResult?.approximated.filter((item) =>
      selectorMatches(item.selector)
    ) ?? [];
  const filteredUnsupported =
    conversionResult?.unsupported.filter((issue) =>
      selectorMatches(issue.selector)
    ) ?? [];
  const filteredWarnings =
    conversionResult?.warnings.filter((issue) =>
      selectorMatches(issue.selector)
    ) ?? [];
  const statusCounts: Record<ReviewStatus, number> = {
    all:
      filteredRules.length +
      filteredUnsupported.length +
      filteredWarnings.length +
      filteredApproximated.length,
    converted: filteredConverted.length,
    approximated: filteredApproximated.length,
    unsupported: filteredUnsupported.length,
    warnings: filteredWarnings.length,
  };
  const filtersActive = reviewSelector !== "all" || reviewStatus !== "all";
  const hasReviewItems =
    filteredRules.length > 0 ||
    filteredUnsupported.length > 0 ||
    filteredWarnings.length > 0 ||
    filteredApproximated.length > 0 ||
    filteredConverted.length > 0;
  const hasIssues =
    conversionResult
      ? conversionResult.unsupported.length > 0 ||
        conversionResult.warnings.length > 0 ||
        conversionResult.approximated.length > 0
      : false;
  const clearReviewFilters = () => {
    setReviewSelector("all");
    setReviewStatus("all");
  };
  const previewWidth: Record<PreviewViewport, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };
  const sanitizedHtmlText = sanitizePreviewHtml(htmlText);
  const sanitizedTailwindText = sanitizePreviewHtml(tailwindText);
  const sanitizedCssText = sanitizePreviewCss(cssText);
  const originalPreviewDoc = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${sanitizedCssText}</style>
</head>
<body>${sanitizedHtmlText}</body>
</html>`;
  const convertedPreviewDoc = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body>${sanitizedTailwindText}</body>
</html>`;
  const previewIsStale =
    Boolean(tailwindText) &&
    (lastConversionInput.html !== htmlText ||
      lastConversionInput.css !== cssText);

  const getNewHtml = useCallback(
    (html: string, css: string, mode: ConversionMode = conversionMode) => {
      const result = convertHtmlCss(
        html.replace(/=(?:')([^']+)'/g, '="$1"'), // converts single quotes to double
        css,
        mode
      );
      const formattedHtml = html_beautify(result.html, {
        indent_size: 2,
        extra_liners: [],
        wrap_line_length: 70,
        max_preserve_newlines: 0,
      });
      setConversionResult({ ...result, html: formattedHtml });
      setLastConversionInput({ html, css });
      return formattedHtml;
    },
    [conversionMode]
  );

  const updateConversionMode = (mode: ConversionMode) => {
    setConversionMode(mode);
    if (htmlText && cssText) {
      setTailwindText(getNewHtml(htmlText, cssText, mode));
    }
  };

  const convertToTailwind = () => {
    try {
      setCssText(
        css_beautify(cssText, { indent_size: 2, max_preserve_newlines: 0 })
      );
      setTailwindText(getNewHtml(htmlText, cssText));
      track("Convert success");
      toast("Converted to Tailwind!", {
        duration: 2000,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        track("Convert error", { error: error.message });
      } else track("Convert error failure");
      toast(`Error converting to tailwind: ${error}`, {
        duration: 4000,
      });
    }
  };

  useEffect(
    () => setCssText(localStorage.css ? localStorage.css : initialCSS),
    []
  );
  useEffect(
    () => setHtmlText(localStorage.html ? localStorage.html : initialHTML),
    []
  );

  useEffect(() => {
    if (!firstSync.current && htmlText && cssText) {
      setTailwindText(getNewHtml(htmlText, cssText));
      firstSync.current = true;
    }
  }, [htmlText, cssText, getNewHtml]);

  useEffect(() => {
    if (cssText) {
      localStorage.setItem("css", cssText);
    }
  }, [cssText]);
  useEffect(() => {
    if (htmlText) {
      localStorage.setItem("html", htmlText);
    }
  }, [htmlText]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="h-screen">
        <Header onThemeChange={handleThemeChange} />
        <ResizablePanelGroup
          direction="horizontal"
          className="h-40 border"
          style={maxHeight}
          aria-label="html/css code mirror panels"
        >
          <ResizablePanel className="min-w-10 sm:min-w-60">
            <ResizablePanelGroup
              direction="vertical"
              aria-label="tailwind code mirror panels"
            >
              <div className="flex justify-between">
                <h2 className="p-4 text-lg font-medium">HTML</h2>
                <div className="flex">
                  <Button
                    onClick={() => reset()}
                    variant="outline"
                    aria-label="reset html and css"
                    size="icon"
                    className="mr-2.5 mt-3.5 cursor-pointer px-5"
                  >
                    <Undo />
                  </Button>
                  <form
                    action="https://codepen.io/pen/define"
                    method="POST"
                    target="_blank"
                  >
                    <input type="hidden" name="data" value={codepenOriginal} />
                    <Button
                      variant="outline"
                      type="submit"
                      title="codepen preview"
                      value=""
                      className="mr-2.5 mt-3.5 cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                        <line x1="12" x2="12" y1="22" y2="15.5" />
                        <polyline points="22 8.5 12 15.5 2 8.5" />
                        <polyline points="2 15.5 12 8.5 22 15.5" />
                        <line x1="12" x2="12" y1="2" y2="8.5" />
                      </svg>
                    </Button>
                  </form>
                  <Button
                    onClick={convertToTailwind}
                    className="mr-4 mt-3.5 cursor-pointer"
                  >
                    Convert
                  </Button>
                </div>
              </div>
              <ResizablePanel className="min-w-10 min-h-40">
                <CodeMirror
                  aria-label="html input"
                  className="h-full text-[15px]"
                  theme={theme === "dark" ? oneDark : "light"}
                  value={htmlText}
                  height="100%"
                  extensions={[html()]}
                  onChange={(value) => {
                    setHtmlText(value);
                  }}
                />
              </ResizablePanel>
              <ResizableHandle />
              <h2 className="p-4 text-lg font-medium">CSS</h2>
              <ResizablePanel className="min-h-40">
                <CodeMirror
                  aria-label="css input"
                  className="h-full text-[15px]"
                  theme={theme === "dark" ? oneDark : "light"}
                  value={cssText}
                  height="100%"
                  extensions={[css()]}
                  onChange={(value) => {
                    setCssText(value);
                  }}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle aria-label="vertical resize panel" />
          <ResizablePanel className="min-w-10 sm:min-w-80">
            <div className="flex flex-col h-full">
              <div className="flex flex-wrap justify-between gap-2 bg-background">
                <div className="flex min-w-0">
                  <h2 className="p-4 text-lg font-medium">Tailwind</h2>
                  <Button
                    onClick={() => copyToClipboard()}
                    variant="ghost"
                    size="icon"
                    aria-label="copy tailwind output"
                    className="mt-3 -ml-3 cursor-pointer dark:hover:bg-gray-700"
                  >
                    <Copy />
                  </Button>
                </div>
                <div className="flex flex-wrap justify-end">
                  <div
                    className="mr-2.5 mt-3.5 inline-flex h-9 overflow-hidden rounded-md border bg-background"
                    aria-label="conversion mode"
                  >
                    <Button
                      onClick={() => updateConversionMode("tokens")}
                      variant={
                        conversionMode === "tokens" ? "secondary" : "ghost"
                      }
                      className="h-9 rounded-none px-3"
                    >
                      Tokens
                    </Button>
                    <Button
                      onClick={() => updateConversionMode("exact")}
                      variant={
                        conversionMode === "exact" ? "secondary" : "ghost"
                      }
                      className="h-9 rounded-none px-3"
                    >
                      Exact
                    </Button>
                  </div>
                  <form
                    action="https://codepen.io/pen/define"
                    method="POST"
                    target="_blank"
                  >
                    <input type="hidden" name="data" value={codepenTailwind} />
                    <Button
                      variant="outline"
                      type="submit"
                      title="codepen preview"
                      value=""
                      className="mr-4 mt-3.5 cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                        <line x1="12" x2="12" y1="22" y2="15.5" />
                        <polyline points="22 8.5 12 15.5 2 8.5" />
                        <polyline points="2 15.5 12 8.5 22 15.5" />
                        <line x1="12" x2="12" y1="2" y2="8.5" />
                      </svg>
                    </Button>
                  </form>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2">
                <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
                  <Button
                    onClick={() => setOutputView("html")}
                    variant={outputView === "html" ? "secondary" : "ghost"}
                    className="h-9 rounded-none px-3"
                  >
                    <Code2 />
                    HTML
                  </Button>
                  <Button
                    onClick={() => setOutputView("review")}
                    variant={outputView === "review" ? "secondary" : "ghost"}
                    className="h-9 rounded-none px-3"
                  >
                    <ClipboardList />
                    Review
                  </Button>
                  <Button
                    onClick={() => setOutputView("css")}
                    variant={outputView === "css" ? "secondary" : "ghost"}
                    className="h-9 rounded-none px-3"
                  >
                    <FileWarning />
                    CSS
                  </Button>
                  <Button
                    onClick={() => setOutputView("preview")}
                    variant={outputView === "preview" ? "secondary" : "ghost"}
                    className="h-9 rounded-none px-3"
                  >
                    <Eye />
                    Preview
                  </Button>
                </div>
                {conversionResult && (
                  <div className="flex min-w-56 flex-wrap items-center gap-2 text-sm">
                    <div className="w-32">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{confidenceLabel}</span>
                        <span>{confidencePercent}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="rounded border px-2 py-1">
                      Converted {convertedCount}
                    </span>
                    <span className="rounded border px-2 py-1">
                      Review {reviewCount}
                    </span>
                    {conversionResult.leftoverCss && (
                      <span className="rounded border px-2 py-1">
                        CSS preserved
                      </span>
                    )}
                    {previewIsStale && (
                      <span className="rounded border border-destructive/40 px-2 py-1 text-destructive">
                        Preview stale
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                {outputView === "html" && (
                  <CodeMirror
                    aria-label="tailwind html"
                    className="h-full text-[15px] overflow-auto"
                    theme={theme === "dark" ? oneDark : "light"}
                    value={tailwindText}
                    readOnly={true}
                    height="100%"
                    extensions={[html()]}
                  />
                )}
                {outputView === "css" && (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b px-4 py-2">
                      <h3 className="text-sm font-medium">Preserved CSS</h3>
                      <Button
                        onClick={copyLeftoverCss}
                        variant="outline"
                        size="sm"
                        disabled={!conversionResult?.leftoverCss}
                      >
                        <Copy />
                        Copy
                      </Button>
                    </div>
                    <CodeMirror
                      aria-label="leftover css"
                      className="min-h-0 flex-1 text-[15px] overflow-auto"
                      theme={theme === "dark" ? oneDark : "light"}
                      value={
                        conversionResult?.leftoverCss ||
                        "No leftover CSS was preserved."
                      }
                      readOnly={true}
                      height="100%"
                      extensions={[css()]}
                    />
                  </div>
                )}
                {outputView === "review" && (
                  <div className="h-full overflow-auto bg-background p-4 text-sm">
                    {!conversionResult && (
                      <p className="text-muted-foreground">
                        Convert HTML and CSS to see review details.
                      </p>
                    )}
                    {conversionResult && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label="selector filter"
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={reviewSelector}
                            onChange={(event) =>
                              setReviewSelector(event.target.value)
                            }
                          >
                            <option value="all">All selectors</option>
                            {selectorOptions.map((selector) => (
                              <option key={selector} value={selector}>
                                {selector}
                              </option>
                            ))}
                          </select>
                          <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
                            {(
                              [
                                "all",
                                "converted",
                                "approximated",
                                "unsupported",
                                "warnings",
                              ] as ReviewStatus[]
                            ).map((status) => (
                              <Button
                                key={status}
                                onClick={() => setReviewStatus(status)}
                                variant={
                                  reviewStatus === status
                                    ? "secondary"
                                    : "ghost"
                                }
                                className="h-9 rounded-none px-3 capitalize"
                              >
                                {status} {statusCounts[status]}
                              </Button>
                            ))}
                          </div>
                          {filtersActive && (
                            <Button
                              onClick={clearReviewFilters}
                              variant="outline"
                              size="sm"
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                        {!hasIssues && !filtersActive && (
                          <div className="rounded border p-4">
                            <h3 className="mb-1 font-medium">
                              No review items
                            </h3>
                            <p className="text-muted-foreground">
                              All declarations converted without warnings or
                              preserved CSS.
                            </p>
                          </div>
                        )}
                        {(reviewStatus === "all" ||
                          reviewStatus === "converted") && (
                          <section>
                          <h3 className="mb-2 font-medium">By Selector</h3>
                          <div className="space-y-2">
                            {filteredRules.map((rule, index) => (
                              <div
                                key={`${rule.selector}-${index}`}
                                className="rounded border p-3"
                              >
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-medium">
                                    {rule.selector}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {rule.declarations.length} classes
                                  </span>
                                </div>
                                <div className="break-words font-mono text-xs text-muted-foreground">
                                  {rule.classes || "Preserved for review"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                        )}
                        {(reviewStatus === "all" ||
                          reviewStatus === "unsupported") &&
                          filteredUnsupported.length > 0 && (
                          <section>
                            <h3 className="mb-2 font-medium">Needs Review</h3>
                            <div className="space-y-2 text-muted-foreground">
                              {filteredUnsupported.map((issue, index) => (
                                  <p key={`unsupported-${index}`}>
                                    <span className="font-medium text-foreground">
                                      {issue.selector}
                                    </span>{" "}
                                    {issue.property
                                      ? `${issue.property}: ${issue.value}`
                                      : ""}{" "}
                                    {issue.message}
                                  </p>
                              ))}
                            </div>
                          </section>
                        )}
                        {(reviewStatus === "all" ||
                          reviewStatus === "warnings") &&
                          filteredWarnings.length > 0 && (
                          <section>
                            <h3 className="mb-2 font-medium">Warnings</h3>
                            <div className="space-y-2 text-muted-foreground">
                              {filteredWarnings.map((issue, index) => (
                                  <p key={`warning-${index}`}>
                                    <span className="font-medium text-foreground">
                                      {issue.selector}
                                    </span>{" "}
                                    {issue.message}
                                  </p>
                              ))}
                            </div>
                          </section>
                        )}
                        {(reviewStatus === "all" ||
                          reviewStatus === "approximated") &&
                          filteredApproximated.length > 0 && (
                          <section>
                            <h3 className="mb-2 font-medium">Approximated</h3>
                            <div className="space-y-2 text-muted-foreground">
                              {filteredApproximated.map((item, index) => (
                                  <p key={`approximated-${index}`}>
                                    <span className="font-medium text-foreground">
                                      {item.selector ?? "CSS"}
                                    </span>{" "}
                                    <span className="font-medium text-foreground">
                                      {item.property}: {item.value}
                                    </span>{" "}
                                    became {item.className}. {item.message}
                                  </p>
                              ))}
                            </div>
                          </section>
                        )}
                        {reviewStatus === "converted" &&
                          filteredConverted.length > 0 && (
                            <section>
                              <h3 className="mb-2 font-medium">Converted</h3>
                              <div className="space-y-2 text-muted-foreground">
                                {filteredConverted.map((item, index) => (
                                  <p key={`converted-${index}`}>
                                    <span className="font-medium text-foreground">
                                      {item.selector ?? "CSS"}
                                    </span>{" "}
                                    <span className="font-medium text-foreground">
                                      {item.property}: {item.value}
                                    </span>{" "}
                                    became {item.className}.
                                  </p>
                                ))}
                              </div>
                            </section>
                          )}
                        {!hasReviewItems && (
                            <p className="text-muted-foreground">
                              No review items match the current filters.
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                )}
                {outputView === "preview" && (
                  <div className="flex h-full flex-col bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
                      <div>
                        <h3 className="text-sm font-medium">Preview</h3>
                        {previewIsStale && (
                          <p className="text-xs text-destructive">
                            Input changed after the last conversion.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
                          {(["split", "original", "converted"] as PreviewMode[]).map(
                            (mode) => (
                              <Button
                                key={mode}
                                onClick={() => setPreviewMode(mode)}
                                variant={
                                  previewMode === mode ? "secondary" : "ghost"
                                }
                                className="h-9 rounded-none px-3 capitalize"
                              >
                                {mode}
                              </Button>
                            )
                          )}
                        </div>
                        <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
                          <Button
                            onClick={() => setPreviewViewport("desktop")}
                            variant={
                              previewViewport === "desktop"
                                ? "secondary"
                                : "ghost"
                            }
                            className="h-9 rounded-none px-3"
                          >
                            <Monitor />
                            Desktop
                          </Button>
                          <Button
                            onClick={() => setPreviewViewport("tablet")}
                            variant={
                              previewViewport === "tablet"
                                ? "secondary"
                                : "ghost"
                            }
                            className="h-9 rounded-none px-3"
                          >
                            <Tablet />
                            Tablet
                          </Button>
                          <Button
                            onClick={() => setPreviewViewport("mobile")}
                            variant={
                              previewViewport === "mobile"
                                ? "secondary"
                                : "ghost"
                            }
                            className="h-9 rounded-none px-3"
                          >
                            <Smartphone />
                            Mobile
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-4">
                      <div
                        className={
                          previewMode === "split"
                            ? "mx-auto grid h-full min-h-[28rem] gap-4 lg:grid-cols-2"
                            : "mx-auto grid h-full min-h-[28rem] gap-4"
                        }
                        style={{
                          maxWidth: previewWidth[previewViewport],
                        }}
                      >
                        {(previewMode === "split" ||
                          previewMode === "original") && (
                          <section className="min-h-0 overflow-hidden rounded border">
                            <div className="border-b px-3 py-2 text-sm font-medium">
                              Original
                            </div>
                            <iframe
                              title="Original preview"
                              sandbox=""
                              srcDoc={originalPreviewDoc}
                              className="h-[calc(100%-2.25rem)] w-full bg-white"
                            />
                          </section>
                        )}
                        {(previewMode === "split" ||
                          previewMode === "converted") && (
                          <section className="min-h-0 overflow-hidden rounded border">
                            <div className="border-b px-3 py-2 text-sm font-medium">
                              Converted
                            </div>
                            <iframe
                              title="Converted preview"
                              sandbox="allow-scripts"
                              srcDoc={convertedPreviewDoc}
                              className="h-[calc(100%-2.25rem)] w-full bg-white"
                            />
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
                    </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        <Toaster
          toastOptions={{
            style: {
              backgroundColor: "var(--toast-bg)",
              color: "var(--toast-text)",
              borderColor: "var(--toast-border)",
              width: "250px",
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
