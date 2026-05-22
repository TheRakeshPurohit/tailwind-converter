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
import { convertHtmlCss, initialHTML, initialCSS } from "./util/helper";
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
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { track } from "@vercel/analytics";
import type { ConversionMode } from "./util/converter";
import {
  generatePreviewCss,
  sanitizePreviewCss,
  sanitizePreviewHtml,
} from "./util/preview";
import { cn } from "./lib/utils";

type OutputView = "html" | "review" | "css" | "preview";
type ReviewStatus =
  | "all"
  | "converted"
  | "approximated"
  | "unsupported"
  | "preserved"
  | "warnings";
type PreviewViewport = "desktop" | "tablet" | "mobile";
type PreviewMode = "split" | "original" | "converted";

const preservedWarningCategories = new Set([
  "relationship-based",
  "pseudo-element",
  "media-query",
  "keyframes",
]);

const reviewBadgeClasses: Record<Exclude<ReviewStatus, "all">, string> = {
  converted:
    "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  approximated:
    "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  unsupported: "border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300",
  preserved: "border-slate-500/20 bg-slate-500/5 text-slate-700 dark:text-slate-300",
  warnings:
    "border-violet-500/20 bg-violet-500/5 text-violet-700 dark:text-violet-300",
};

const reviewStatusDotClasses: Record<ReviewStatus, string> = {
  all: "bg-muted-foreground",
  converted: "bg-emerald-500",
  approximated: "bg-amber-500",
  unsupported: "bg-rose-500",
  preserved: "bg-slate-400",
  warnings: "bg-violet-500",
};

const reviewFilterButtonClass = (isSelected: boolean) =>
  cn(
    "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
    isSelected
      ? "border-foreground/25 bg-muted text-foreground shadow-xs dark:border-white/20 dark:bg-muted/80"
      : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/60 hover:text-foreground"
  );

const countPillClass =
  "rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground dark:bg-background/50";

const reviewCardClass = "rounded-md border border-border/70 bg-card/30 p-3";

const categoryPillClass =
  "rounded-md border border-border/70 bg-muted/30 px-1.5 py-0.5 text-xs text-muted-foreground";

const ReviewStatusDot = ({ status }: { status: ReviewStatus }) => (
  <span
    aria-hidden="true"
    className={cn("size-1.5 rounded-full", reviewStatusDotClasses[status])}
  />
);

const segmentedButtonClass = (isSelected: boolean, className?: string) =>
  cn(
    "h-9 cursor-pointer rounded-none px-3",
    !isSelected &&
      "hover:bg-primary/10 hover:text-foreground dark:hover:bg-primary/15",
    className
  );

const ReviewBadge = ({
  status,
  children,
}: {
  status: Exclude<ReviewStatus, "all">;
  children: ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
      reviewBadgeClasses[status]
    )}
  >
    <ReviewStatusDot status={status} />
    {children}
  </span>
);

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

  const reviewCount = conversionResult
    ? conversionResult.unsupported.length +
      conversionResult.preservedRules.length +
      conversionResult.warnings.filter(
        (issue) => !preservedWarningCategories.has(issue.category)
      ).length
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
          ...conversionResult.preservedRules.map((rule) => rule.selector),
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
    conversionResult?.converted.filter((item) =>
      selectorMatches(item.selector)
    ) ?? [];
  const filteredApproximated =
    conversionResult?.approximated.filter((item) =>
      selectorMatches(item.selector)
    ) ?? [];
  const filteredUnsupported =
    conversionResult?.unsupported.filter((issue) =>
      selectorMatches(issue.selector)
    ) ?? [];
  const filteredPreservedRules =
    conversionResult?.preservedRules.filter((rule) =>
      selectorMatches(rule.selector)
    ) ?? [];
  const filteredWarnings =
    conversionResult?.warnings.filter(
      (issue) =>
        !preservedWarningCategories.has(issue.category) &&
        selectorMatches(issue.selector)
    ) ?? [];
  const reviewStatusLabels: Record<ReviewStatus, string> = {
    all: "All",
    converted: "Converted",
    approximated: "Approximated",
    unsupported: "Unsupported",
    preserved: "Preserved",
    warnings: "Warnings",
  };
  const reportWarningCount =
    conversionResult?.warnings.filter(
      (issue) => !preservedWarningCategories.has(issue.category)
    ).length ?? 0;
  const statusCounts: Record<ReviewStatus, number> = {
    all:
      filteredRules.length +
      filteredUnsupported.length +
      filteredPreservedRules.length +
      filteredWarnings.length +
      filteredApproximated.length,
    converted: filteredConverted.length,
    approximated: filteredApproximated.length,
    unsupported: filteredUnsupported.length,
    preserved: filteredPreservedRules.length,
    warnings: filteredWarnings.length,
  };
  const filtersActive = reviewSelector !== "all" || reviewStatus !== "all";
  const hasReviewItems =
    filteredRules.length > 0 ||
    filteredUnsupported.length > 0 ||
    filteredPreservedRules.length > 0 ||
    filteredWarnings.length > 0 ||
    filteredApproximated.length > 0 ||
    filteredConverted.length > 0;
  const hasIssues = conversionResult
    ? conversionResult.unsupported.length > 0 ||
      conversionResult.preservedRules.length > 0 ||
      reportWarningCount > 0 ||
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
  const generatedPreviewCss = sanitizePreviewCss(
    generatePreviewCss(sanitizedTailwindText)
  );
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
<style>${generatedPreviewCss}</style>
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
                    className="mr-4 mt-3.5 inline-flex h-9 overflow-hidden rounded-md border bg-background"
                    aria-label="conversion mode"
                  >
                    <Button
                      onClick={() => updateConversionMode("tokens")}
                      variant={
                        conversionMode === "tokens" ? "default" : "ghost"
                      }
                      aria-pressed={conversionMode === "tokens"}
                      className={segmentedButtonClass(
                        conversionMode === "tokens"
                      )}
                    >
                      Tokens
                    </Button>
                    <Button
                      onClick={() => updateConversionMode("exact")}
                      variant={conversionMode === "exact" ? "default" : "ghost"}
                      aria-pressed={conversionMode === "exact"}
                      className={segmentedButtonClass(
                        conversionMode === "exact"
                      )}
                    >
                      Exact
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2">
                <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
                  <Button
                    onClick={() => setOutputView("html")}
                    variant={outputView === "html" ? "default" : "ghost"}
                    aria-pressed={outputView === "html"}
                    className={segmentedButtonClass(outputView === "html")}
                  >
                    <Code2 />
                    HTML
                  </Button>
                  <Button
                    onClick={() => setOutputView("review")}
                    variant={outputView === "review" ? "default" : "ghost"}
                    aria-pressed={outputView === "review"}
                    className={segmentedButtonClass(outputView === "review")}
                  >
                    <ClipboardList />
                    Review
                  </Button>
                  <Button
                    onClick={() => setOutputView("css")}
                    variant={outputView === "css" ? "default" : "ghost"}
                    aria-pressed={outputView === "css"}
                    className={segmentedButtonClass(outputView === "css")}
                  >
                    <FileWarning />
                    CSS
                  </Button>
                  <Button
                    onClick={() => setOutputView("preview")}
                    variant={outputView === "preview" ? "default" : "ghost"}
                    aria-pressed={outputView === "preview"}
                    className={segmentedButtonClass(outputView === "preview")}
                  >
                    <Eye />
                    Preview
                  </Button>
                </div>
                {conversionResult && (
                  <div className="flex min-w-56 flex-wrap items-center gap-2 text-sm justify-start lg:justify-end">
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
                      <div className="rounded-md border border-border/70 bg-card/30 p-4">
                        <h3 className="mb-1 font-medium">Review Report</h3>
                        <p className="text-muted-foreground">
                          Convert HTML and CSS to see converted classes,
                          approximations, unsupported declarations, and
                          preserved selectors.
                        </p>
                      </div>
                    )}
                    {conversionResult && (
                      <div className="space-y-4">
                        <div className={reviewCardClass}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="font-medium">Conversion Report</h3>
                              <p className="text-xs text-muted-foreground">
                                {confidenceLabel} confidence -{" "}
                                {confidencePercent}% direct conversions
                              </p>
                            </div>
                            {conversionResult.leftoverCss && (
                              <Button
                                onClick={copyLeftoverCss}
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                              >
                                <Copy />
                                Copy preserved CSS
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label="selector filter"
                            className="h-9 cursor-pointer rounded-md border bg-background px-3 text-sm"
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
                          <div className="flex flex-wrap gap-1.5">
                            {(
                              [
                                "all",
                                "converted",
                                "approximated",
                                "unsupported",
                                "preserved",
                                "warnings",
                              ] as ReviewStatus[]
                            ).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setReviewStatus(status)}
                                aria-pressed={reviewStatus === status}
                                className={reviewFilterButtonClass(
                                  reviewStatus === status
                                )}
                              >
                                <ReviewStatusDot status={status} />
                                <span>{reviewStatusLabels[status]}</span>
                                <span className={countPillClass}>
                                  {statusCounts[status]}
                                </span>
                              </button>
                            ))}
                          </div>
                          {filtersActive && (
                            <Button
                              onClick={clearReviewFilters}
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                        {!hasIssues && !filtersActive && (
                          <div className="rounded-md border border-border/70 bg-card/30 p-4">
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
                                  className={reviewCardClass}
                                >
                                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium">
                                        {rule.selector}
                                      </span>
                                      <ReviewBadge status="converted">
                                        Converted
                                      </ReviewBadge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
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
                              <h3 className="mb-2 font-medium">
                                Unsupported Declarations
                              </h3>
                              <div className="space-y-2">
                                {filteredUnsupported.map((issue, index) => (
                                  <div
                                    key={`unsupported-${index}`}
                                    className={`${reviewCardClass} text-muted-foreground`}
                                  >
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        {issue.selector}
                                      </span>
                                      <ReviewBadge status="unsupported">
                                        Unsupported
                                      </ReviewBadge>
                                      <span className={categoryPillClass}>
                                        {issue.category}
                                      </span>
                                    </div>
                                    {issue.property && (
                                      <div className="mb-1 font-mono text-xs text-foreground">
                                        {issue.property}: {issue.value}
                                      </div>
                                    )}
                                    {issue.message}
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        {(reviewStatus === "all" ||
                          reviewStatus === "preserved") &&
                          filteredPreservedRules.length > 0 && (
                            <section>
                              <h3 className="mb-2 font-medium">
                                Preserved Selectors
                              </h3>
                              <div className="space-y-3">
                                {filteredPreservedRules.map((rule, index) => (
                                  <div
                                    key={`preserved-${rule.selector}-${index}`}
                                    className={reviewCardClass}
                                  >
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                      <span className="font-medium">
                                        {rule.selector}
                                      </span>
                                      <ReviewBadge status="preserved">
                                        Preserved
                                      </ReviewBadge>
                                      <span className={categoryPillClass}>
                                        {rule.category}
                                      </span>
                                    </div>
                                    <p className="mb-2 text-muted-foreground">
                                      {rule.message}
                                    </p>
                                    <pre className="overflow-auto rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                                      <code>{rule.css}</code>
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        {(reviewStatus === "all" ||
                          reviewStatus === "warnings") &&
                          filteredWarnings.length > 0 && (
                            <section>
                              <h3 className="mb-2 font-medium">Warnings</h3>
                              <div className="space-y-2">
                                {filteredWarnings.map((issue, index) => (
                                  <div
                                    key={`warning-${index}`}
                                    className={`${reviewCardClass} text-muted-foreground`}
                                  >
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        {issue.selector}
                                      </span>
                                      <ReviewBadge status="warnings">
                                        Warning
                                      </ReviewBadge>
                                      <span className={categoryPillClass}>
                                        {issue.category}
                                      </span>
                                    </div>
                                    {issue.message}
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        {(reviewStatus === "all" ||
                          reviewStatus === "approximated") &&
                          filteredApproximated.length > 0 && (
                            <section>
                              <h3 className="mb-2 font-medium">Approximated</h3>
                              <div className="space-y-2">
                                {filteredApproximated.map((item, index) => (
                                  <div
                                    key={`approximated-${index}`}
                                    className={`${reviewCardClass} text-muted-foreground`}
                                  >
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        {item.selector ?? "CSS"}
                                      </span>
                                      <ReviewBadge status="approximated">
                                        Approximated
                                      </ReviewBadge>
                                    </div>
                                    <div className="mb-1 font-mono text-xs text-foreground">
                                      {item.property}: {item.value} -&gt;{" "}
                                      {item.className}
                                    </div>
                                    {item.message}
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        {reviewStatus === "converted" &&
                          filteredConverted.length > 0 && (
                            <section>
                              <h3 className="mb-2 font-medium">Converted</h3>
                              <div className="space-y-2">
                                {filteredConverted.map((item, index) => (
                                  <div
                                    key={`converted-${index}`}
                                    className={reviewCardClass}
                                  >
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <span className="font-medium">
                                        {item.selector ?? "CSS"}
                                      </span>
                                      <ReviewBadge status="converted">
                                        Converted
                                      </ReviewBadge>
                                    </div>
                                    <div className="font-mono text-xs text-muted-foreground">
                                      {item.property}: {item.value} -&gt;{" "}
                                      {item.className}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        {!hasReviewItems && (
                          <div className="rounded-md border border-border/70 bg-card/30 p-4 text-muted-foreground">
                            No review items match the current filters.
                          </div>
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
                          {(
                            ["split", "original", "converted"] as PreviewMode[]
                          ).map((mode) => (
                            <Button
                              key={mode}
                              onClick={() => setPreviewMode(mode)}
                              variant={
                                previewMode === mode ? "default" : "ghost"
                              }
                              aria-pressed={previewMode === mode}
                              className={segmentedButtonClass(
                                previewMode === mode,
                                "capitalize"
                              )}
                            >
                              {mode}
                            </Button>
                          ))}
                        </div>
                        <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
                          <Button
                            onClick={() => setPreviewViewport("desktop")}
                            variant={
                              previewViewport === "desktop"
                                ? "default"
                                : "ghost"
                            }
                            aria-pressed={previewViewport === "desktop"}
                            className={segmentedButtonClass(
                              previewViewport === "desktop"
                            )}
                          >
                            <Monitor />
                            Desktop
                          </Button>
                          <Button
                            onClick={() => setPreviewViewport("tablet")}
                            variant={
                              previewViewport === "tablet" ? "default" : "ghost"
                            }
                            aria-pressed={previewViewport === "tablet"}
                            className={segmentedButtonClass(
                              previewViewport === "tablet"
                            )}
                          >
                            <Tablet />
                            Tablet
                          </Button>
                          <Button
                            onClick={() => setPreviewViewport("mobile")}
                            variant={
                              previewViewport === "mobile" ? "default" : "ghost"
                            }
                            aria-pressed={previewViewport === "mobile"}
                            className={segmentedButtonClass(
                              previewViewport === "mobile"
                            )}
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
                              sandbox=""
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
