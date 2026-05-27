import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ConversionIssue,
  ConversionResult,
  PreservedRule,
  UnsupportedCategory,
} from "@/util/helper";
import { AlertTriangle, Copy, Eye } from "lucide-react";
import type { ReactNode } from "react";
import type { OutputView, ReviewStatus } from "@/types";
import { preservedWarningCategories } from "@/util/review";

type ReviewReportProps = {
  conversionResult: ConversionResult | null;
  copyLeftoverCss: () => void;
  copyReviewSummary: () => void;
  previewIsStale: boolean;
  reviewSelector: string;
  reviewStatus: ReviewStatus;
  setOutputView: (view: OutputView) => void;
  setReviewSelector: (selector: string) => void;
  setReviewStatus: (status: ReviewStatus) => void;
};

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

const categorySummaryClass =
  "rounded-md border border-border/70 bg-card/30 p-3";

const reviewStatusLabels: Record<ReviewStatus, string> = {
  all: "All",
  converted: "Converted",
  approximated: "Approximated",
  unsupported: "Unsupported",
  preserved: "Preserved",
  warnings: "Warnings",
};

const reviewCategoryLabels: Record<UnsupportedCategory, string> = {
  animation: "Animations",
  "background-image": "Background Images",
  "compound-shorthand": "Compound Shorthands",
  "complex-selector": "Complex Selectors",
  "container-query": "Container Queries",
  "css-variable": "CSS Variables",
  "filter-effect": "Filter Effects",
  "grid-placement": "Grid Placement",
  keyframes: "Keyframes",
  "media-query": "Media Queries",
  "pseudo-element": "Pseudo-elements",
  "relationship-based": "Related Selectors",
  "tailwind-gap": "Tailwind Gaps",
  "unsupported-property": "Unsupported Properties",
  "unsupported-value": "Unsupported Values",
  "unmatched-selector": "Unmatched Selectors",
};

const reviewCategoryDescriptions: Record<UnsupportedCategory, string> = {
  animation:
    "Animations stay in preserved CSS until animation and keyframe utilities can be mapped safely.",
  "background-image":
    "Background images and complex gradients need exact utilities or preserved CSS.",
  "compound-shorthand":
    "Some shorthand values mix multiple concerns and need manual review.",
  "complex-selector":
    "Complex selectors are preserved when they cannot be applied safely to one element.",
  "container-query":
    "Container queries are preserved because container-aware conversion is not implemented yet.",
  "css-variable":
    "Variable values are preserved until theme token mapping is available.",
  "filter-effect":
    "Filter chains are preserved when any function lacks a safe Tailwind mapping.",
  "grid-placement":
    "Complex grid placement stays preserved when spans or line names cannot be mapped.",
  keyframes:
    "Keyframes are preserved because generated animation definitions need manual migration.",
  "media-query":
    "Media queries outside default Tailwind breakpoints are preserved for review.",
  "pseudo-element":
    "Pseudo-elements create generated content and cannot be placed on the original element.",
  "relationship-based":
    "Related selectors may depend on document structure and should be checked in context.",
  "tailwind-gap":
    "These declarations map to Tailwind utility families that are not supported yet.",
  "unsupported-property":
    "These properties do not have a converter mapping yet.",
  "unsupported-value":
    "These values could not be parsed or matched safely.",
  "unmatched-selector":
    "These selectors exist in the CSS but do not match the provided HTML.",
};

const reviewCategoryOrder: UnsupportedCategory[] = [
  "relationship-based",
  "unmatched-selector",
  "pseudo-element",
  "background-image",
  "grid-placement",
  "filter-effect",
  "animation",
  "keyframes",
  "container-query",
  "media-query",
  "css-variable",
  "compound-shorthand",
  "tailwind-gap",
  "complex-selector",
  "unsupported-property",
  "unsupported-value",
];

type CategoryReviewItem =
  | {
      status: "unsupported";
      category: UnsupportedCategory;
      issue: ConversionIssue;
    }
  | {
      status: "preserved";
      category: UnsupportedCategory;
      rule: PreservedRule;
    }
  | {
      status: "warnings";
      category: UnsupportedCategory;
      issue: ConversionIssue;
    };

const categoryLabel = (category: UnsupportedCategory) =>
  reviewCategoryLabels[category] ?? category;

function ReviewStatusDot({ status }: { status: ReviewStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 rounded-full", reviewStatusDotClasses[status])}
    />
  );
}

function ReviewBadge({
  status,
  children,
}: {
  status: Exclude<ReviewStatus, "all">;
  children: ReactNode;
}) {
  return (
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
}

export function ReviewReport({
  conversionResult,
  copyLeftoverCss,
  copyReviewSummary,
  previewIsStale,
  reviewSelector,
  reviewStatus,
  setOutputView,
  setReviewSelector,
  setReviewStatus,
}: ReviewReportProps) {
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
  const categoryItems: CategoryReviewItem[] = [
    ...(reviewStatus === "all" || reviewStatus === "unsupported"
      ? filteredUnsupported.map((issue) => ({
          status: "unsupported" as const,
          category: issue.category,
          issue,
        }))
      : []),
    ...(reviewStatus === "all" || reviewStatus === "preserved"
      ? filteredPreservedRules.map((rule) => ({
          status: "preserved" as const,
          category: rule.category,
          rule,
        }))
      : []),
    ...(reviewStatus === "all" || reviewStatus === "warnings"
      ? filteredWarnings.map((issue) => ({
          status: "warnings" as const,
          category: issue.category,
          issue,
        }))
      : []),
  ];
  const categoryGroups = reviewCategoryOrder
    .map((category) => ({
      category,
      items: categoryItems.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
  const categoryStatusCounts = (items: CategoryReviewItem[]) => ({
    unsupported: items.filter((item) => item.status === "unsupported").length,
    preserved: items.filter((item) => item.status === "preserved").length,
    warnings: items.filter((item) => item.status === "warnings").length,
  });
  const clearReviewFilters = () => {
    setReviewSelector("all");
    setReviewStatus("all");
  };

  return (
    <div className="h-full overflow-auto bg-background p-4 text-sm">
      {!conversionResult && (
        <div className="rounded-md border border-border/70 bg-card/30 p-4">
          <h3 className="mb-1 font-medium">Review Report</h3>
          <p className="text-muted-foreground">
            Convert HTML and CSS to see converted classes, approximations,
            unsupported declarations, and preserved selectors.
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
                  {confidenceLabel} confidence - {confidencePercent}% direct
                  conversions
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={copyReviewSummary}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <Copy />
                  Copy summary
                </Button>
                <Button
                  onClick={() => setOutputView("preview")}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <Eye />
                  Open preview
                </Button>
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
          </div>
          {previewIsStale && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <h3 className="font-medium">
                  Review is based on an older conversion
                </h3>
                <p className="text-xs">
                  Convert again before relying on the report or visual preview.
                </p>
              </div>
            </div>
          )}
          {conversionResult.leftoverCss && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-sm">
              <div>
                <h3 className="font-medium text-foreground">
                  Preserved CSS is included in the converted preview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Check these rules in Review, then compare the result in
                  Preview before copying the output.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setReviewStatus("preserved")}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  Show preserved
                </Button>
                <Button
                  onClick={() => setOutputView("preview")}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <Eye />
                  Compare preview
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="selector filter"
              className="h-9 cursor-pointer rounded-md border bg-background px-3 text-sm"
              value={reviewSelector}
              onChange={(event) => setReviewSelector(event.target.value)}
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
              <h3 className="mb-1 font-medium">No review items</h3>
              <p className="text-muted-foreground">
                All declarations converted without warnings or preserved CSS.
              </p>
            </div>
          )}
          {categoryGroups.length > 0 && (
            <section>
              <h3 className="mb-2 font-medium">Migration Checklist</h3>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {categoryGroups.map((group) => {
                  const counts = categoryStatusCounts(group.items);

                  return (
                    <div
                      key={`category-summary-${group.category}`}
                      className={categorySummaryClass}
                    >
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium">
                          {categoryLabel(group.category)}
                        </h4>
                        <span className={countPillClass}>
                          {group.items.length}
                        </span>
                      </div>
                      <p className="mb-2 text-xs leading-5 text-muted-foreground">
                        {reviewCategoryDescriptions[group.category]}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {counts.unsupported > 0 && (
                          <ReviewBadge status="unsupported">
                            {counts.unsupported} unsupported
                          </ReviewBadge>
                        )}
                        {counts.preserved > 0 && (
                          <ReviewBadge status="preserved">
                            {counts.preserved} preserved
                          </ReviewBadge>
                        )}
                        {counts.warnings > 0 && (
                          <ReviewBadge status="warnings">
                            {counts.warnings} warnings
                          </ReviewBadge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {categoryGroups.length > 0 && (
            <section>
              <h3 className="mb-2 font-medium">Review By Category</h3>
              <div className="space-y-3">
                {categoryGroups.map((group) => (
                  <div
                    key={`category-group-${group.category}`}
                    className={reviewCardClass}
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium">
                          {categoryLabel(group.category)}
                        </h4>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {reviewCategoryDescriptions[group.category]}
                        </p>
                      </div>
                      <span className={countPillClass}>
                        {group.items.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item, index) => {
                        if (item.status === "preserved") {
                          return (
                            <div
                              key={`category-preserved-${group.category}-${index}`}
                              className="rounded-md border border-border/60 bg-background/50 p-3"
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="font-medium">
                                  {item.rule.selector}
                                </span>
                                <ReviewBadge status="preserved">
                                  Preserved
                                </ReviewBadge>
                              </div>
                              <p className="mb-2 text-muted-foreground">
                                {item.rule.message}
                              </p>
                              <pre className="overflow-auto rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                                <code>{item.rule.css}</code>
                              </pre>
                            </div>
                          );
                        }

                        const issue = item.issue;

                        return (
                          <div
                            key={`category-issue-${group.category}-${index}`}
                            className="rounded-md border border-border/60 bg-background/50 p-3 text-muted-foreground"
                          >
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">
                                {issue.selector}
                              </span>
                              <ReviewBadge status={item.status}>
                                {reviewStatusLabels[item.status]}
                              </ReviewBadge>
                            </div>
                            {issue.property && (
                              <div className="mb-1 font-mono text-xs text-foreground">
                                {issue.property}: {issue.value}
                              </div>
                            )}
                            {issue.message}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {(reviewStatus === "all" || reviewStatus === "converted") && (
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
                        <span className="font-medium">{rule.selector}</span>
                        <ReviewBadge status="converted">Converted</ReviewBadge>
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
          {(reviewStatus === "all" || reviewStatus === "approximated") &&
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
                        {item.property}: {item.value} -&gt; {item.className}
                      </div>
                      {item.message}
                    </div>
                  ))}
                </div>
              </section>
            )}
          {reviewStatus === "converted" && filteredConverted.length > 0 && (
            <section>
              <h3 className="mb-2 font-medium">Converted</h3>
              <div className="space-y-2">
                {filteredConverted.map((item, index) => (
                  <div key={`converted-${index}`} className={reviewCardClass}>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {item.selector ?? "CSS"}
                      </span>
                      <ReviewBadge status="converted">Converted</ReviewBadge>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {item.property}: {item.value} -&gt; {item.className}
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
  );
}
