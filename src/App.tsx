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
  GalleryVerticalEnd,
  Undo,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { track } from "@vercel/analytics";
import type { ConversionMode } from "./util/converter";
import {
  buildPreviewDoc,
  generatePreviewCss,
  sanitizePreviewCss,
  sanitizePreviewHtml,
} from "./util/preview";
import { cn } from "./lib/utils";
import { ExamplesDialog } from "./components/examples-dialog";
import { PreviewPanel } from "./components/preview-panel";
import { ReviewReport } from "./components/review-report";
import { SeoContent } from "./components/seo-content";
import { exampleSnippets } from "./data/example-snippets";
import type { ExampleSnippet } from "./data/example-snippets";
import { preservedWarningCategories } from "./util/review";
import type {
  OutputView,
  PreviewMode,
  PreviewViewport,
  ReviewStatus,
} from "./types";

const segmentedButtonClass = (isSelected: boolean, className?: string) =>
  cn(
    "h-9 cursor-pointer rounded-none px-3",
    !isSelected &&
      "hover:bg-primary/10 hover:text-foreground dark:hover:bg-primary/15",
    className
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
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [loadedExampleName, setLoadedExampleName] = useState("");
  const [lastConversionInput, setLastConversionInput] = useState({
    html: "",
    css: "",
  });
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("vite-ui-theme");
    return savedTheme ? savedTheme : "dark";
  });
  const firstSync = useRef(false);

  const maxHeight = {
    maxHeight: "calc(100% - 4rem)",
  };

  const getNewHtml = useCallback(
    (html: string, css: string, mode: ConversionMode = conversionMode) => {
      const result = convertHtmlCss(
        html.replace(/=(?:')([^']+)'/g, '="$1"'),
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

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme === "dark" ? "light" : "dark");
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

  const copyReviewSummary = () => {
    if (!conversionResult) return;

    const reportWarnings = conversionResult.warnings.filter(
      (issue) => !preservedWarningCategories.has(issue.category)
    );
    const totalDeclarations =
      conversionResult.converted.length +
      conversionResult.approximated.length +
      conversionResult.unsupported.length;
    const directPercent =
      totalDeclarations > 0
        ? Math.round(
            (conversionResult.converted.length / totalDeclarations) * 100
          )
        : 0;
    const lines = [
      "Tailwind Converter Review Summary",
      "",
      `Direct conversions: ${conversionResult.converted.length}`,
      `Approximations: ${conversionResult.approximated.length}`,
      `Unsupported declarations: ${conversionResult.unsupported.length}`,
      `Preserved CSS rules: ${conversionResult.preservedRules.length}`,
      `Warnings: ${reportWarnings.length}`,
      `Direct conversion rate: ${directPercent}%`,
    ];

    if (conversionResult.approximated.length > 0) {
      lines.push(
        "",
        "Approximations:",
        ...conversionResult.approximated.map(
          (item) =>
            `- ${item.selector ?? "CSS"}: ${item.property}: ${item.value} -> ${item.className}`
        )
      );
    }

    if (conversionResult.unsupported.length > 0) {
      lines.push(
        "",
        "Unsupported:",
        ...conversionResult.unsupported.map(
          (issue) =>
            `- ${issue.selector}: ${issue.property ?? "CSS"}${issue.value ? `: ${issue.value}` : ""} (${issue.category})`
        )
      );
    }

    if (conversionResult.preservedRules.length > 0) {
      lines.push(
        "",
        "Preserved CSS:",
        ...conversionResult.preservedRules.map(
          (rule) => `- ${rule.selector} (${rule.category})`
        )
      );
    }

    if (reportWarnings.length > 0) {
      lines.push(
        "",
        "Warnings:",
        ...reportWarnings.map(
          (issue) => `- ${issue.selector} (${issue.category}): ${issue.message}`
        )
      );
    }

    toast("Copied review summary!", {
      duration: 2000,
    });
    navigator.clipboard.writeText(lines.join("\n"));
  };

  const loadExample = (example: ExampleSnippet) => {
    setHtmlText(example.html);
    setCssText(example.css);
    setTailwindText(getNewHtml(example.html, example.css));
    setLoadedExampleName(example.name);
    setOutputView("html");
    setExamplesOpen(false);
    toast(`Loaded ${example.name}`, {
      duration: 2000,
    });
  };

  const reset = () => {
    setHtmlText(initialHTML);
    setCssText(initialCSS);
    setLoadedExampleName("");
  };

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
  const sanitizedHtmlText = sanitizePreviewHtml(htmlText);
  const sanitizedTailwindText = sanitizePreviewHtml(tailwindText);
  const sanitizedCssText = sanitizePreviewCss(cssText);
  const generatedPreviewCss = sanitizePreviewCss(
    generatePreviewCss(sanitizedTailwindText)
  );
  const originalPreviewDoc = buildPreviewDoc(
    sanitizedHtmlText,
    sanitizedCssText
  );
  const convertedPreviewDoc = buildPreviewDoc(
    sanitizedTailwindText,
    generatedPreviewCss
  );
  const previewIsStale =
    Boolean(tailwindText) &&
    (lastConversionInput.html !== htmlText ||
      lastConversionInput.css !== cssText);

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
      <div className="bg-background text-foreground">
        <div className="h-screen">
          <Header onThemeChange={handleThemeChange} />
          <ResizablePanelGroup
            direction="horizontal"
            className="h-40 border-t"
            style={maxHeight}
            aria-label="html/css code mirror panels"
          >
            <ResizablePanel className="min-w-10 sm:min-w-60">
              <ResizablePanelGroup
                direction="vertical"
                aria-label="tailwind code mirror panels"
              >
                <div className="flex justify-between">
                  <div className="min-w-0 px-4 py-3">
                    <h2 className="text-lg font-medium">HTML</h2>
                    {loadedExampleName && (
                      <p className="truncate text-xs text-muted-foreground">
                        Example: {loadedExampleName}
                      </p>
                    )}
                  </div>
                  <div className="flex">
                    <Button
                      onClick={() => setExamplesOpen(true)}
                      variant="outline"
                      aria-label="load example"
                      className="mr-2.5 mt-3.5 cursor-pointer"
                    >
                      <GalleryVerticalEnd />
                      Examples
                    </Button>
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
              <div className="flex h-full flex-col">
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
                        variant={
                          conversionMode === "exact" ? "default" : "ghost"
                        }
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
                      className="h-full overflow-auto text-[15px]"
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
                        className="min-h-0 flex-1 overflow-auto text-[15px]"
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
                    <ReviewReport
                      conversionResult={conversionResult}
                      copyLeftoverCss={copyLeftoverCss}
                      copyReviewSummary={copyReviewSummary}
                      previewIsStale={previewIsStale}
                      reviewSelector={reviewSelector}
                      reviewStatus={reviewStatus}
                      setOutputView={setOutputView}
                      setReviewSelector={setReviewSelector}
                      setReviewStatus={setReviewStatus}
                    />
                  )}
                  {outputView === "preview" && (
                    <PreviewPanel
                      conversionResult={conversionResult}
                      convertedPreviewDoc={convertedPreviewDoc}
                      originalPreviewDoc={originalPreviewDoc}
                      previewIsStale={previewIsStale}
                      previewMode={previewMode}
                      previewViewport={previewViewport}
                      segmentedButtonClass={segmentedButtonClass}
                      setOutputView={setOutputView}
                      setPreviewMode={setPreviewMode}
                      setPreviewViewport={setPreviewViewport}
                      setReviewStatus={setReviewStatus}
                    />
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
        <ExamplesDialog
          open={examplesOpen}
          onOpenChange={setExamplesOpen}
          examples={exampleSnippets}
          onLoadExample={loadExample}
        />
        <SeoContent />
      </div>
    </ThemeProvider>
  );
}

export default App;
