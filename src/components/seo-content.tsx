export function SeoContent() {
  return (
    <section className="border-t bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-normal">
            CSS to Tailwind Converter
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Tailwind Converter helps you convert plain HTML and CSS into HTML
            with Tailwind CSS utility classes. Paste your markup and stylesheet,
            choose token matching or exact arbitrary values, then review the
            converted classes and any CSS that should stay preserved.
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
              Tokens mode maps CSS values to nearby Tailwind design tokens.
              Exact mode uses arbitrary value utilities when visual fidelity
              matters more than token cleanliness.
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
              <li>
                6. Supported declarations become Tailwind utility classes.
              </li>
              <li>
                7. Unsupported CSS is preserved in a leftover style block.
              </li>
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
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Check out my other project,{" "}
              <a
                href="https://ffwrapped.com"
                target="_blank"
                rel="me noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                ffwrapped
              </a>
              .
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
                No. Relationship-based selectors, pseudo-elements, keyframes,
                and some complex CSS cannot be safely represented as classes on
                the original element. Those rules are preserved for review.
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
                which is helpful when you prefer clean classes over exact
                values.
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
}
