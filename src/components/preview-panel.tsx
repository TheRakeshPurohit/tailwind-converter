import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConversionResult } from "@/util/helper";
import { preservedWarningCategories } from "@/util/review";
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import type {
  OutputView,
  PreviewMode,
  PreviewViewport,
  ReviewStatus,
} from "@/types";

type PreviewPanelProps = {
  conversionResult: ConversionResult | null;
  convertedPreviewDoc: string;
  originalPreviewDoc: string;
  previewIsStale: boolean;
  previewMode: PreviewMode;
  previewViewport: PreviewViewport;
  segmentedButtonClass: (isSelected: boolean, className?: string) => string;
  setOutputView: (view: OutputView) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setPreviewViewport: (viewport: PreviewViewport) => void;
  setReviewStatus: (status: ReviewStatus) => void;
};

const previewWidth: Record<PreviewViewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const reviewSummaryCardClass =
  "flex min-w-32 items-center gap-2 rounded-md border border-border/70 bg-card/30 px-3 py-2";

export function PreviewPanel({
  conversionResult,
  convertedPreviewDoc,
  originalPreviewDoc,
  previewIsStale,
  previewMode,
  previewViewport,
  segmentedButtonClass,
  setOutputView,
  setPreviewMode,
  setPreviewViewport,
  setReviewStatus,
}: PreviewPanelProps) {
  const warningCount =
    conversionResult?.warnings.filter(
      (issue) => !preservedWarningCategories.has(issue.category)
    ).length ?? 0;
  const reviewCounts = {
    converted: conversionResult?.converted.length ?? 0,
    approximated: conversionResult?.approximated.length ?? 0,
    unsupported: conversionResult?.unsupported.length ?? 0,
    preserved: conversionResult?.preservedRules.length ?? 0,
    warnings: warningCount,
  };
  const openReviewFilter = (status: ReviewStatus) => {
    setReviewStatus(status);
    setOutputView("review");
  };
  const hasReviewAttention =
    reviewCounts.approximated > 0 ||
    reviewCounts.unsupported > 0 ||
    reviewCounts.preserved > 0 ||
    reviewCounts.warnings > 0;

  return (
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
                  variant={previewMode === mode ? "default" : "ghost"}
                  aria-pressed={previewMode === mode}
                  className={segmentedButtonClass(
                    previewMode === mode,
                    "capitalize"
                  )}
                >
                  {mode}
                </Button>
              )
            )}
          </div>
          <div className="inline-flex h-9 overflow-hidden rounded-md border bg-background">
            <Button
              onClick={() => setPreviewViewport("desktop")}
              variant={previewViewport === "desktop" ? "default" : "ghost"}
              aria-pressed={previewViewport === "desktop"}
              className={segmentedButtonClass(previewViewport === "desktop")}
            >
              <Monitor />
              Desktop
            </Button>
            <Button
              onClick={() => setPreviewViewport("tablet")}
              variant={previewViewport === "tablet" ? "default" : "ghost"}
              aria-pressed={previewViewport === "tablet"}
              className={segmentedButtonClass(previewViewport === "tablet")}
            >
              <Tablet />
              Tablet
            </Button>
            <Button
              onClick={() => setPreviewViewport("mobile")}
              variant={previewViewport === "mobile" ? "default" : "ghost"}
              aria-pressed={previewViewport === "mobile"}
              className={segmentedButtonClass(previewViewport === "mobile")}
            >
              <Smartphone />
              Mobile
            </Button>
          </div>
        </div>
      </div>
      {conversionResult && (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2 text-sm">
          <div className={reviewSummaryCardClass}>
            <CheckCircle2 className="size-4 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">Converted</div>
              <div className="font-medium">{reviewCounts.converted}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openReviewFilter("approximated")}
            disabled={reviewCounts.approximated === 0}
            className={cn(
              reviewSummaryCardClass,
              "cursor-pointer text-left transition-colors hover:border-foreground/20 hover:bg-muted/60",
              reviewCounts.approximated === 0 &&
                "cursor-default opacity-60 hover:border-border/70 hover:bg-card/30"
            )}
          >
            <AlertTriangle className="size-4 text-amber-500" />
            <div>
              <div className="text-xs text-muted-foreground">Approximated</div>
              <div className="font-medium">{reviewCounts.approximated}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => openReviewFilter("unsupported")}
            disabled={reviewCounts.unsupported === 0}
            className={cn(
              reviewSummaryCardClass,
              "cursor-pointer text-left transition-colors hover:border-foreground/20 hover:bg-muted/60",
              reviewCounts.unsupported === 0 &&
                "cursor-default opacity-60 hover:border-border/70 hover:bg-card/30"
            )}
          >
            <FileWarning className="size-4 text-rose-500" />
            <div>
              <div className="text-xs text-muted-foreground">Unsupported</div>
              <div className="font-medium">{reviewCounts.unsupported}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => openReviewFilter("preserved")}
            disabled={reviewCounts.preserved === 0}
            className={cn(
              reviewSummaryCardClass,
              "cursor-pointer text-left transition-colors hover:border-foreground/20 hover:bg-muted/60",
              reviewCounts.preserved === 0 &&
                "cursor-default opacity-60 hover:border-border/70 hover:bg-card/30"
            )}
          >
            <FileWarning className="size-4 text-slate-400" />
            <div>
              <div className="text-xs text-muted-foreground">Preserved</div>
              <div className="font-medium">{reviewCounts.preserved}</div>
            </div>
          </button>
          {reviewCounts.warnings > 0 && (
            <Button
              type="button"
              onClick={() => openReviewFilter("warnings")}
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <AlertTriangle />
              Review {reviewCounts.warnings} warnings
            </Button>
          )}
          {!hasReviewAttention && (
            <span className="text-xs text-muted-foreground">
              No preserved CSS or conversion warnings.
            </span>
          )}
        </div>
      )}
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
          {(previewMode === "split" || previewMode === "original") && (
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
          {(previewMode === "split" || previewMode === "converted") && (
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
  );
}
