import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Layers3,
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
  buildPreviewDoc,
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

type ExampleSnippet = {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  result: string;
  html: string;
  css: string;
};

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
  unsupported:
    "border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300",
  preserved:
    "border-slate-500/20 bg-slate-500/5 text-slate-700 dark:text-slate-300",
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

const exampleSnippets: ExampleSnippet[] = [
  {
    id: "pricing-card",
    name: "Pricing card",
    description:
      "A clean component with spacing, color, borders, shadows, and hover state.",
    highlights: ["spacing", "colors", "hover"],
    result: "Mostly clean conversion",
    html: `<section class="pricing-card">
  <p class="eyebrow">Starter</p>
  <h2>Launch faster</h2>
  <p class="price">$19<span>/mo</span></p>
  <p class="summary">Everything you need to convert small landing pages and prototypes.</p>
  <a class="button" href="#">Start converting</a>
</section>`,
    css: `.pricing-card {
  max-width: 360px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.pricing-card:hover {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.eyebrow {
  margin-bottom: 0.5rem;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pricing-card h2 {
  margin-bottom: 1rem;
  color: #111827;
  font-size: 2rem;
  line-height: 1.2;
}

.price {
  margin-bottom: 1rem;
  color: #111827;
  font-size: 3rem;
  font-weight: 800;
}

.price span {
  color: #6b7280;
  font-size: 1rem;
  font-weight: 400;
}

.summary {
  margin-bottom: 1.5rem;
  color: #4b5563;
  line-height: 1.625;
}

.button {
  display: inline-block;
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  background-color: #10b981;
  color: white;
  font-weight: 700;
  text-decoration-line: none;
}`,
  },
  {
    id: "responsive-navbar",
    name: "Responsive navbar",
    description:
      "Shows flex layout, descendant selectors, hover variants, and a Tailwind breakpoint.",
    highlights: ["flex", "media query", "hover"],
    result: "Includes responsive variants",
    html: `<nav class="site-nav">
  <a class="brand" href="#">Tailwind Converter</a>
  <div class="nav-links">
    <a href="#">Examples</a>
    <a href="#">Docs</a>
    <a href="#">GitHub</a>
  </div>
</nav>`,
    css: `.site-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #111827;
}

.brand {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration-line: none;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-links a {
  color: #d1d5db;
  text-decoration-line: none;
}

.nav-links a:hover {
  color: white;
}

@media (min-width: 768px) {
  .site-nav {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
  }

  .nav-links {
    flex-direction: row;
    align-items: center;
  }
}`,
  },
  {
    id: "signup-form",
    name: "Signup form",
    description:
      "Good for form spacing, labels, inputs, focus states, and exact colors.",
    highlights: ["forms", "focus", "exact values"],
    result: "Good exact-mode candidate",
    html: `<form class="signup-form">
  <div>
    <label for="email">Email address</label>
    <input id="email" type="email" placeholder="you@example.com" />
  </div>
  <button type="submit">Join waitlist</button>
</form>`,
    css: `.signup-form {
  width: 100%;
  max-width: 420px;
  margin: 2rem auto;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: #f9fafb;
}

.signup-form label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
}

.signup-form input {
  display: block;
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background-color: white;
  color: #111827;
}

.signup-form input:focus {
  border-color: #6366f1;
  outline-width: 2px;
  outline-offset: 2px;
  outline-color: #6366f1;
}

.signup-form button {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background-color: #4f46e5;
  color: white;
  font-weight: 700;
}`,
  },
  {
    id: "dashboard-widget",
    name: "Dashboard widget",
    description:
      "A denser UI sample with grid, badges, percentages, and preserved pseudo-element CSS.",
    highlights: ["grid", "badges", "preserved CSS"],
    result: "Shows review workflow",
    html: `<section class="metric-card">
  <div class="metric-header">
    <p>Conversion coverage</p>
    <span>Live</span>
  </div>
  <div class="metric-grid">
    <strong>84%</strong>
    <p>Converted directly</p>
  </div>
</section>`,
    css: `.metric-card {
  max-width: 420px;
  margin: 2rem auto;
  padding: 1rem;
  border-radius: 14px;
  background-color: #111827;
  color: white;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.metric-header p {
  color: #d1d5db;
  font-size: 0.875rem;
}

.metric-header span {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background-color: #064e3b;
  color: #6ee7b7;
  font-size: 0.75rem;
  font-weight: 700;
}

.metric-header span::before {
  content: "";
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.375rem;
  border-radius: 9999px;
  background-color: #34d399;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: 1rem;
}

.metric-grid strong {
  font-size: 3rem;
  line-height: 1;
}

.metric-grid p {
  color: #9ca3af;
  text-align: right;
}`,
  },
];

const SeoContent = () => (
  <section className="border-t bg-background px-4 py-12 text-foreground">
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-normal">
          CSS to Tailwind Converter
        </h2>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Tailwind Converter helps you convert plain HTML and CSS into HTML with
          Tailwind CSS utility classes. Paste your markup and stylesheet, choose
          token matching or exact arbitrary values, then review the converted
          classes and any CSS that should stay preserved.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-medium">Convert HTML and CSS</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The converter applies Tailwind classes back onto matching HTML
            elements, so you can migrate snippets, prototypes, and legacy CSS
            toward a utility-first workflow.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium">Tokens or exact values</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tokens mode maps CSS values to nearby Tailwind design tokens. Exact
            mode uses arbitrary value utilities when visual fidelity matters
            more than token cleanliness.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium">Review preserved CSS</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Unsupported selectors, risky declarations, pseudo-elements, and
            complex media rules are preserved for review instead of being
            silently dropped.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="text-2xl font-semibold tracking-normal">
            How CSS to Tailwind conversion works
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>
              1. CSS is parsed into rules, selectors, at-rules, and
              declarations.
            </li>
            <li>2. Safe selectors are matched against the input HTML.</li>
            <li>
              3. Supported pseudo-classes become Tailwind variants like hover.
            </li>
            <li>
              4. Default Tailwind media queries become responsive prefixes.
            </li>
            <li>
              5. Safe shorthands are expanded before declaration conversion.
            </li>
            <li>6. Supported declarations become Tailwind utility classes.</li>
            <li>7. Unsupported CSS is preserved in a leftover style block.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-normal">
            Useful for Tailwind migrations
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            This tool is built for practical migration work: converting common
            layout, spacing, typography, color, border, grid, transition, and
            transform declarations while making uncertain cases visible. It is
            especially useful when moving older HTML and CSS, copied examples,
            or generated static templates into a Tailwind CSS project.
          </p>
        </section>
      </div>

      <section>
        <h2 className="text-2xl font-semibold tracking-normal">
          CSS to Tailwind FAQ
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="font-medium">
              Can every CSS rule become a Tailwind class?
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              No. Relationship-based selectors, pseudo-elements, keyframes, and
              some complex CSS cannot be safely represented as classes on the
              original element. Those rules are preserved for review.
            </p>
          </div>
          <div>
            <h3 className="font-medium">
              Does the converter support arbitrary values?
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Yes. Exact mode emits arbitrary value classes for supported
              utility families, such as spacing, sizing, colors, shadows, and
              grid templates.
            </p>
          </div>
          <div>
            <h3 className="font-medium">
              What is the difference between converted and approximated?
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Converted declarations map directly to Tailwind utilities.
              Approximated declarations use the nearest Tailwind design token,
              which is helpful when you prefer clean classes over exact values.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Is the conversion private?</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Conversion runs in the browser. The HTML and CSS you paste into
              the editor are processed locally by the web app.
            </p>
          </div>
        </div>
      </section>
    </div>
  </section>
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

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme === "dark" ? "light" : "dark");
  };
  const firstSync = useRef(false);

  const maxHeight = {
    maxHeight: "calc(100% - 4rem)",
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
                                <h3 className="font-medium">
                                  Conversion Report
                                </h3>
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
                                <h3 className="mb-2 font-medium">
                                  Approximated
                                </h3>
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
                              [
                                "split",
                                "original",
                                "converted",
                              ] as PreviewMode[]
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
                                previewViewport === "tablet"
                                  ? "default"
                                  : "ghost"
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
                                previewViewport === "mobile"
                                  ? "default"
                                  : "ghost"
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
        <Dialog open={examplesOpen} onOpenChange={setExamplesOpen}>
          <DialogContent className="max-h-[min(44rem,calc(100vh-2rem))] overflow-hidden p-0 sm:max-w-4xl">
            <DialogHeader className="border-b px-6 py-5">
              <div className="flex items-start gap-3 pr-8">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div>
                  <DialogTitle>Load an Example</DialogTitle>
                  <DialogDescription className="mt-2 max-w-2xl leading-6">
                    Try realistic HTML and CSS snippets that exercise
                    conversion, approximations, variants, media queries, and
                    preserved CSS.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="grid max-h-[calc(100vh-11rem)] gap-3 overflow-auto p-4 sm:grid-cols-2">
              {exampleSnippets.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => loadExample(example)}
                  className="group flex min-h-52 cursor-pointer flex-col justify-between rounded-md border border-border/70 bg-card/30 p-4 text-left transition-colors hover:border-foreground/25 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                          <Layers3 className="size-4" />
                        </span>
                        <div>
                          <h3 className="font-medium">{example.name}</h3>
                        </div>
                      </div>
                      <span className="rounded-md border border-border/70 bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:border-foreground/25 group-hover:text-foreground">
                        Load
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {example.description}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {example.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        <SeoContent />
      </div>
    </ThemeProvider>
  );
}

export default App;
