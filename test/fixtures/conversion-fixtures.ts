import type { ConversionMode } from "../../src/util/converter";

type ExpectedDeclaration = {
  selector: string;
  property: string;
  value?: string;
  className?: string;
};

export type ConversionFixture = {
  name: string;
  html: string;
  css: string;
  mode?: ConversionMode;
  expected: {
    htmlIncludes?: string[];
    htmlExcludes?: string[];
    leftoverIncludes?: string[];
    leftoverExcludes?: string[];
    converted?: ExpectedDeclaration[];
    approximated?: ExpectedDeclaration[];
    unsupported?: ExpectedDeclaration[];
    preservedRules?: Array<{ selector: string; category: string; css?: string }>;
    warnings?: Array<{ selector: string; category: string }>;
  };
};

export const conversionFixtures: ConversionFixture[] = [
  {
    name: "card with typography, action styles, hover state, and approximated shadow",
    html: `
      <section class="hero">
        <article class="card">
          <h2 class="title">Save time</h2>
          <p class="lead">Convert faster.</p>
          <div class="features">
            <span>Fast</span>
            <span>Visible</span>
            <span>Reviewable</span>
          </div>
          <a class="cta" href="#">Start</a>
        </article>
      </section>
    `,
    css: `
      .hero {
        padding: 2rem;
        background: #ffffff;
      }

      .card {
        margin: 0 auto;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      }

      .title {
        font: italic 700 32px/1.25 sans-serif;
        margin-bottom: 0.5rem;
        color: #111827;
      }

      .lead {
        color: #4b5563;
        line-height: 1.5;
        margin-bottom: 1rem;
      }

      .cta {
        display: inline-block;
        padding: 8px 16px;
        background: #2563eb;
        color: white;
        border-radius: 6px;
        text-decoration: none;
        cursor: pointer;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .cta:hover {
        background-color: #1d4ed8;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="p-8 bg-white"',
        "shadow-lg",
        "italic font-bold text-3xl",
        "inline-block pt-2 pr-4 pb-2 pl-4",
        "grid grid-cols-3 gap-4",
        "hover:bg-blue-700",
      ],
      leftoverIncludes: [
        "margin-right: auto;",
        "margin-left: auto;",
      ],
      converted: [{ selector: ".title", property: "font-style", className: "italic" }],
      approximated: [
        { selector: ".card", property: "border-radius" },
        { selector: ".card", property: "box-shadow", className: "shadow-lg" },
        {
          selector: ".features",
          property: "grid-template-columns",
          className: "grid-cols-3",
        },
        { selector: ".title", property: "color" },
        { selector: ".cta:hover", property: "background-color" },
      ],
      unsupported: [
        { selector: ".card", property: "margin-right", value: "auto" },
        { selector: ".card", property: "margin-left", value: "auto" },
      ],
    },
  },
  {
    name: "responsive dashboard keeps supported breakpoints and preserves unsupported media",
    html: `
      <main class="dashboard">
        <div class="toolbar">
          <h1>Reports</h1>
          <button class="filter">Filter</button>
        </div>
        <section class="panel">Revenue</section>
      </main>
    `,
    css: `
      .dashboard {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
      }

      .panel {
        padding: 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
      }

      @media (min-width: 768px) {
        .dashboard {
          padding: 2rem;
        }

        .panel {
          padding: 1.5rem;
        }
      }

      @media (max-width: 700px) {
        .toolbar {
          flex-direction: column;
        }
      }
    `,
    expected: {
      htmlIncludes: [
        "flex flex-col gap-4 p-4 md:p-8",
        "justify-between items-center gap-3",
        "p-4 border border-solid border-gray-300 rounded-lg md:p-6",
      ],
      leftoverIncludes: [
        "@media (max-width: 700px)",
        "flex-direction: column;",
      ],
      leftoverExcludes: ["@media (min-width: 768px)"],
      converted: [
        { selector: ".dashboard", property: "display", className: "flex" },
      ],
      approximated: [
        { selector: ".dashboard", property: "padding", className: "md:p-8" },
        { selector: ".panel", property: "padding", className: "md:p-6" },
      ],
      warnings: [{ selector: "@media (max-width: 700px)", category: "media-query" }],
      preservedRules: [
        {
          selector: ".toolbar",
          category: "media-query",
          css: "@media (max-width: 700px)",
        },
      ],
    },
  },
  {
    name: "unsafe html is stripped while unsupported generated content is preserved",
    html: `
      <div class="notice" onclick="alert('bad')">
        Safe text
        <script>alert("bad")</script>
      </div>
    `,
    css: `
      .notice {
        color: red;
        animation: pulse 1s infinite;
      }

      .notice::before {
        content: "";
      }
    `,
    expected: {
      htmlIncludes: ['class="notice text-red-600"', "Safe text"],
      htmlExcludes: ["<script", "onclick", "undefined"],
      leftoverIncludes: ["animation: pulse 1s infinite;", ".notice::before"],
      approximated: [
        { selector: ".notice", property: "color", className: "text-red-600" },
      ],
      unsupported: [{ selector: ".notice", property: "animation" }],
      preservedRules: [
        {
          selector: ".notice::before",
          category: "pseudo-element",
          css: 'content: "";',
        },
      ],
      warnings: [{ selector: ".notice::before", category: "pseudo-element" }],
    },
  },
];
