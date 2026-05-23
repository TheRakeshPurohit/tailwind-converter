import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConversionResult } from "@/util/helper";
import { Copy } from "lucide-react";
import type { ReactNode } from "react";
import type { ReviewStatus } from "@/types";
import { preservedWarningCategories } from "@/util/review";

type ReviewReportProps = {
  conversionResult: ConversionResult | null;
  copyLeftoverCss: () => void;
  reviewSelector: string;
  reviewStatus: ReviewStatus;
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

const categoryPillClass =
  "rounded-md border border-border/70 bg-muted/30 px-1.5 py-0.5 text-xs text-muted-foreground";

const reviewStatusLabels: Record<ReviewStatus, string> = {
  all: "All",
  converted: "Converted",
  approximated: "Approximated",
  unsupported: "Unsupported",
  preserved: "Preserved",
  warnings: "Warnings",
};

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
  reviewSelector,
  reviewStatus,
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
          {(reviewStatus === "all" || reviewStatus === "unsupported") &&
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
          {(reviewStatus === "all" || reviewStatus === "preserved") &&
            filteredPreservedRules.length > 0 && (
              <section>
                <h3 className="mb-2 font-medium">Preserved Selectors</h3>
                <div className="space-y-3">
                  {filteredPreservedRules.map((rule, index) => (
                    <div
                      key={`preserved-${rule.selector}-${index}`}
                      className={reviewCardClass}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-medium">{rule.selector}</span>
                        <ReviewBadge status="preserved">Preserved</ReviewBadge>
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
          {(reviewStatus === "all" || reviewStatus === "warnings") &&
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
                        <ReviewBadge status="warnings">Warning</ReviewBadge>
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
