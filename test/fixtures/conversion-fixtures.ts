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
    name: "simple landing page converts common global, layout, and descendant styles",
    html: `
      <header class="navbar">
        <h1 class="logo">MySite</h1>
        <nav>
          <ul class="nav-links">
            <li><a href="#">Home</a></li>
            <li><a href="#">Features</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </nav>
        <button class="login-btn">Login</button>
      </header>

      <section class="hero">
        <div class="hero-content">
          <h2>Build something amazing</h2>
          <p>Create modern websites faster with clean design and responsive layouts.</p>
          <div class="button-group">
            <button class="primary-btn">Get Started</button>
            <button class="secondary-btn">Learn More</button>
          </div>
        </div>

        <div class="card">
          <h3>Dashboard Preview</h3>
          <div class="stats-grid">
            <div class="stat-box"><span>Users</span><strong>12k</strong></div>
            <div class="stat-box"><span>Revenue</span><strong>$24k</strong></div>
            <div class="stat-box"><span>Growth</span><strong>18%</strong></div>
            <div class="stat-box"><span>Retention</span><strong>91%</strong></div>
          </div>
        </div>
      </section>
    `,
    css: `
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background: #f5f7fb;
        color: #222;
      }

      .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 50px;
        background: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, .08);
      }

      .logo {
        font-size: 24px;
        font-weight: bold;
      }

      .nav-links {
        display: flex;
        gap: 24px;
        list-style: none;
      }

      .nav-links a {
        text-decoration: none;
        color: #444;
      }

      .nav-links a:hover {
        color: #2563eb;
      }

      .login-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        background: #2563eb;
        color: white;
        cursor: pointer;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 80px auto;
        padding: 0 40px;
        gap: 50px;
      }

      .hero-content {
        flex: 1;
      }

      .hero-content h2 {
        font-size: 56px;
        margin-bottom: 20px;
      }

      .hero-content p {
        font-size: 18px;
        line-height: 1.7;
        color: #666;
        margin-bottom: 30px;
      }

      .button-group {
        display: flex;
        gap: 16px;
      }

      .primary-btn {
        padding: 14px 24px;
        background: #2563eb;
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 16px;
        cursor: pointer;
      }

      .secondary-btn {
        padding: 14px 24px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 10px;
        cursor: pointer;
      }

      .card {
        flex: 1;
        background: white;
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, .08);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-top: 20px;
      }

      .stat-box {
        background: #f4f6fa;
        padding: 20px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat-box strong {
        font-size: 28px;
      }
    `,
    expected: {
      htmlIncludes: [
        '<body class="m-0 p-0',
        'class="text-2xl font-bold"',
        'class="nav-links flex gap-6 list-none"',
        'class="no-underline text-neutral-700 hover:text-blue-600"',
        'class="flex justify-between items-center max-w-6xl my-20 mx-auto py-0 px-10',
        'class="hero-content flex-1"',
        '<h2 class="text-6xl mb-5">Build something amazing</h2>',
        '<p class="text-lg leading-7 text-stone-500 mb-7">',
        'class="grid grid-cols-2 gap-5 mt-5"',
        'class="stat-box bg-slate-100 p-5 rounded-xl flex flex-col gap-2"',
        '<strong class="text-3xl">12k</strong>',
      ],
      leftoverExcludes: [
        "body {",
        ".hero-content p",
        ".stat-box strong",
      ],
      converted: [
        { selector: "body", property: "margin", className: "m-0" },
        { selector: ".logo", property: "font-weight", className: "font-bold" },
        { selector: ".hero", property: "margin-right", className: "mr-auto" },
        { selector: ".hero", property: "margin-left", className: "ml-auto" },
      ],
      warnings: [
        { selector: ".nav-links a", category: "relationship-based" },
        { selector: ".nav-links a:hover", category: "relationship-based" },
        { selector: ".hero-content h2", category: "relationship-based" },
        { selector: ".hero-content p", category: "relationship-based" },
        { selector: ".stat-box strong", category: "relationship-based" },
      ],
    },
  },
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
        transition: background-color 200ms ease-out;
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
        "my-0 mx-auto",
        "shadow-lg",
        "italic font-bold text-3xl",
        "inline-block py-2 px-4",
        "transition-colors ease-out duration-200",
        "grid grid-cols-3 gap-4",
        "hover:bg-blue-700",
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
        {
          selector: ".cta",
          property: "transition-property",
          className: "transition-colors",
        },
      ],
    },
  },
  {
    name: "exact mode preserves landing page visual values",
    mode: "exact",
    html: `
      <section class="hero">
        <p class="lead">Create modern websites faster.</p>
        <div class="card">Dashboard Preview</div>
      </section>
    `,
    css: `
      .hero {
        margin: 80px auto;
        padding: 0 40px;
        background: #f5f7fb;
      }

      .lead {
        color: #666;
        line-height: 1.7;
        margin-bottom: 30px;
      }

      .card {
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, .08);
      }
    `,
    expected: {
      htmlIncludes: [
        'class="my-[80px] mx-auto py-0 px-[40px] bg-[#f5f7fb]"',
        'class="text-[#666] leading-[1.7] mb-[30px]"',
        'class="rounded-[20px] shadow-[0_15px_35px_rgba(0\\,_0\\,_0\\,_.08)]"',
      ],
      converted: [
        { selector: ".hero", property: "margin-top", className: "mt-[80px]" },
        { selector: ".hero", property: "margin-right", className: "mr-auto" },
        { selector: ".hero", property: "padding-right", className: "pr-[40px]" },
        { selector: ".lead", property: "color", className: "text-[#666]" },
        { selector: ".lead", property: "line-height", className: "leading-[1.7]" },
        { selector: ".card", property: "border-radius", className: "rounded-[20px]" },
        {
          selector: ".card",
          property: "box-shadow",
          className: "shadow-[0_15px_35px_rgba(0\\,_0\\,_0\\,_.08)]",
        },
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
