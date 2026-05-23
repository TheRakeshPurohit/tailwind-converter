import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { PreviewMode, PreviewViewport } from "@/types";

type PreviewPanelProps = {
  convertedPreviewDoc: string;
  originalPreviewDoc: string;
  previewIsStale: boolean;
  previewMode: PreviewMode;
  previewViewport: PreviewViewport;
  segmentedButtonClass: (isSelected: boolean, className?: string) => string;
  setPreviewMode: (mode: PreviewMode) => void;
  setPreviewViewport: (viewport: PreviewViewport) => void;
};

const previewWidth: Record<PreviewViewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export function PreviewPanel({
  convertedPreviewDoc,
  originalPreviewDoc,
  previewIsStale,
  previewMode,
  previewViewport,
  segmentedButtonClass,
  setPreviewMode,
  setPreviewViewport,
}: PreviewPanelProps) {
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
