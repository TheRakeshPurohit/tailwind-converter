import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryVerticalEnd, Layers3 } from "lucide-react";
import type { ExampleSnippet } from "@/data/example-snippets";

type ExamplesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examples: ExampleSnippet[];
  onLoadExample: (example: ExampleSnippet) => void;
};

export function ExamplesDialog({
  open,
  onOpenChange,
  examples,
  onLoadExample,
}: ExamplesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(44rem,calc(100vh-2rem))] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <div>
              <DialogTitle>Load an Example</DialogTitle>
              <DialogDescription className="mt-2 max-w-2xl leading-6">
                Try realistic HTML and CSS snippets that exercise conversion,
                approximations, variants, media queries, and preserved CSS.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid max-h-[calc(100vh-11rem)] gap-3 overflow-auto p-4 sm:grid-cols-2">
          {examples.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => onLoadExample(example)}
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
  );
}
