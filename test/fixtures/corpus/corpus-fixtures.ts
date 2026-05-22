import type { ConversionFixture } from "../conversion-fixtures";

export const corpusFixtures: ConversionFixture[] = [
  {
    name: "corpus landing: messy SaaS hero with generated content",
    html: `
      <section class="hero hero--blue">
        <div class="hero-shell">
          <div class="hero-copy">
            <span class="eyebrow">New release</span>
            <h1>Launch faster with less CSS drift</h1>
            <p>Old landing pages usually mix reusable classes, descendant selectors, and one-off hero polish.</p>
            <a class="btn primary" href="#">Start free</a>
          </div>
          <div class="hero-card">
            <strong>42%</strong>
            <span>less manual cleanup</span>
          </div>
        </div>
      </section>
    `,
    css: `
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #f8fafc;
        color: #1f2937;
      }

      .hero {
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, #2563eb, #0f766e);
        color: white;
      }

      .hero::before {
        content: "";
        position: absolute;
        inset: 0;
        opacity: .3;
      }

      .hero-shell {
        max-width: 1180px;
        margin: 0 auto;
        padding: 64px 24px;
        display: flex;
        align-items: center;
        gap: 40px;
      }

      .hero-copy h1 {
        margin: 0 0 16px;
        font-size: 56px;
        line-height: 1.05;
      }

      .eyebrow {
        display: inline-block;
        margin-bottom: 16px;
        padding: 6px 10px;
        border-radius: 9999px;
        background: white;
        color: #2563eb;
        font-weight: 700;
      }

      .primary:hover {
        background-color: #1d4ed8;
      }
    `,
    expected: {
      htmlIncludes: [
        '<body class="m-0 font-sans bg-slate-50 text-gray-800">',
        'class="hero hero--blue relative overflow-hidden text-white"',
        'class="max-w-6xl my-0 mx-auto py-16 px-6 flex items-center gap-10"',
        'class="inline-block mb-4 py-1.5 px-2.5 rounded-full bg-white text-blue-600 font-bold"',
        'class="btn hover:bg-blue-700"',
      ],
      leftoverIncludes: [".hero::before", "background-image: linear-gradient"],
      unsupported: [
        { selector: ".hero", property: "background-image", category: "unsupported-property" },
      ],
      warnings: [
        { selector: ".hero::before", category: "pseudo-element" },
        { selector: ".hero-copy h1", category: "relationship-based" },
      ],
    },
  },
  {
    name: "corpus landing: pricing strip with responsive cards",
    html: `
      <section class="pricing">
        <div class="pricing-inner">
          <article class="plan featured">
            <h2>Pro</h2>
            <p class="price">$29</p>
            <ul><li>Unlimited projects</li><li>Team reviews</li></ul>
          </article>
          <article class="plan">
            <h2>Team</h2>
            <p class="price">$79</p>
            <ul><li>SSO</li><li>Priority support</li></ul>
          </article>
        </div>
      </section>
    `,
    css: `
      .pricing {
        padding: 48px 16px;
        background: #ffffff;
      }

      .pricing-inner {
        max-width: 960px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }

      .plan {
        padding: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 10px 15px rgba(0,0,0,.08);
      }

      .featured {
        transform: translateY(-8px);
      }

      .plan ul {
        margin: 16px 0 0;
        padding-left: 20px;
      }

      @media (max-width: 767px) {
        .pricing-inner {
          grid-template-columns: 1fr;
        }
      }
    `,
    expected: {
      htmlIncludes: [
        'class="py-12 px-4 bg-white"',
        'class="max-w-4xl my-0 mx-auto grid grid-cols-2 gap-6"',
        'class="plan -translate-y-2 p-6 border border-solid border-gray-200 rounded-xl shadow-lg"',
      ],
      leftoverIncludes: ["@media (max-width: 767px)"],
      approximated: [
        { selector: ".plan", property: "box-shadow", className: "shadow-lg" },
        { selector: ".featured", property: "transform", className: "-translate-y-2" },
      ],
      warnings: [
        { selector: ".plan ul", category: "relationship-based" },
        { selector: "@media (max-width: 767px)", category: "media-query" },
      ],
    },
  },
  {
    name: "corpus landing: agency feature band with odd spacing",
    html: `
      <section class="feature-band">
        <div class="feature-copy">
          <h2>Migration reports people can read</h2>
          <p>Approximate classes, preserved CSS, and unsupported rules are separated.</p>
        </div>
        <div class="metric-box">
          <span>Review items</span>
          <strong>18</strong>
        </div>
      </section>
    `,
    css: `
      .feature-band {
        width: 100%;
        max-width: 1100px;
        margin: 33px auto;
        padding: 31px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f4f4f5;
        border-radius: 18px;
      }

      .feature-copy h2 {
        margin: 0 0 11px;
        font-size: 34px;
        letter-spacing: -0.02em;
      }

      .metric-box {
        min-width: 180px;
        padding: 21px;
        text-align: center;
        background: white;
        border: 1px solid #d4d4d8;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="w-full max-w-6xl my-8 mx-auto p-8 flex justify-between items-center bg-zinc-100 rounded-2xl"',
        'class="metric-box p-5 text-center bg-white border border-solid border-zinc-300"',
      ],
      leftoverIncludes: ["min-width: 180px"],
      approximated: [
        { selector: ".feature-band", property: "margin-top", className: "mt-8" },
        { selector: ".feature-band", property: "padding", className: "p-8" },
      ],
      warnings: [
        { selector: ".feature-copy h2", category: "relationship-based" },
      ],
    },
  },
  {
    name: "corpus bootstrap-ish: marketing grid with rows and columns",
    html: `
      <div class="container marketing">
        <div class="row">
          <div class="col-md-6">
            <h2>Classic grid</h2>
            <p>Many sites have Bootstrap-like class names and custom CSS layered on top.</p>
          </div>
          <div class="col-md-6 card-panel">Panel</div>
        </div>
      </div>
    `,
    css: `
      .container {
        width: 100%;
        max-width: 1140px;
        margin-right: auto;
        margin-left: auto;
        padding-right: 15px;
        padding-left: 15px;
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        margin-right: -15px;
        margin-left: -15px;
      }

      .col-md-6 {
        position: relative;
        width: 100%;
        padding-right: 15px;
        padding-left: 15px;
      }

      @media (min-width: 768px) {
        .col-md-6 {
          flex: 0 0 50%;
          max-width: 50%;
        }
      }

      .card-panel {
        background-color: #ffffff;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="w-full max-w-6xl mx-auto px-3.5 marketing"',
        'class="flex flex-wrap -mx-3.5"',
        'class="col-md-6 relative w-full px-3.5"',
        'class="col-md-6 bg-white border border-solid border-zinc-200 rounded relative w-full px-3.5"',
      ],
      leftoverIncludes: ["@media (min-width: 768px)", "flex: 0 0 50%"],
    },
  },
  {
    name: "corpus bootstrap-ish: buttons alerts and utility collisions",
    html: `
      <div class="alert alert-warning">
        <strong>Heads up!</strong> Check the preserved CSS.
      </div>
      <p><a class="btn btn-primary btn-lg" href="#">Continue</a></p>
    `,
    css: `
      .alert {
        padding: 12px 20px;
        margin-bottom: 16px;
        border: 1px solid transparent;
        border-radius: 4px;
      }

      .alert-warning {
        color: #92400e;
        background-color: #fef3c7;
        border-color: #f59e0b;
      }

      .alert strong {
        font-weight: 700;
      }

      .btn {
        display: inline-block;
        padding: 10px 16px;
        border-radius: 4px;
        text-decoration: none;
      }

      .btn-primary {
        background-color: #0d6efd;
        color: #fff;
      }

      .btn-lg {
        padding: 14px 24px;
        font-size: 20px;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="alert text-amber-800 bg-amber-100 border-amber-500 py-3 px-5 mb-4 border border-solid border-transparent rounded"',
        'class="inline-block py-2.5 px-4 rounded no-underline bg-blue-600 text-white py-3.5 px-6 text-xl"',
      ],
      warnings: [
        { selector: ".alert strong", category: "relationship-based" },
      ],
    },
  },
  {
    name: "corpus bootstrap-ish: form controls with focus state",
    html: `
      <form class="form-inline">
        <label class="sr-label" for="email">Email</label>
        <input class="form-control" id="email" value="team@example.com" />
        <button class="btn btn-success">Invite</button>
      </form>
    `,
    css: `
      .form-inline {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .form-control {
        width: 320px;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 16px;
      }

      .form-control:focus {
        outline: 2px solid #93c5fd;
        outline-offset: 2px;
      }

      .sr-label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }

      .btn-success {
        padding: 8px 16px;
        background-color: #198754;
        color: white;
        border: 0;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="flex items-center gap-3"',
        'class="form-control w-80 py-2 px-3 border border-solid border-gray-300 rounded text-base focus:outline-offset-2"',
        'class="absolute w-0 h-0 overflow-hidden"',
        'class="btn py-2 px-4 bg-green-700 text-white border-0"',
      ],
      leftoverIncludes: [".form-control:focus", "outline: 2px solid #93c5fd"],
    },
  },
  {
    name: "corpus CMS: article body with rich text descendants",
    html: `
      <article class="article-body">
        <h1>Quarterly update</h1>
        <p>Editors often paste rich text with predictable descendant selectors.</p>
        <h2>Highlights</h2>
        <ul><li>Cleaner reviews</li><li>Safer fallbacks</li></ul>
        <blockquote>Migration should be transparent.</blockquote>
      </article>
    `,
    css: `
      .article-body {
        max-width: 720px;
        margin: 0 auto;
        padding: 32px 20px;
        color: #1f2937;
      }

      .article-body h1 {
        margin: 0 0 24px;
        font-size: 42px;
        line-height: 1.1;
      }

      .article-body p {
        margin-bottom: 18px;
        font-size: 18px;
        line-height: 1.75;
      }

      .article-body blockquote {
        margin: 24px 0;
        padding-left: 16px;
        border-left: 4px solid #2563eb;
        font-style: italic;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="article-body max-w-2xl my-0 mx-auto py-8 px-5 text-gray-800"',
        '<h1 class="mt-0 mx-0 mb-6 text-5xl leading-none">Quarterly update</h1>',
        '<blockquote class="my-6 mx-0 pl-4 border-l-4 border-solid border-l-blue-600 italic">Migration should be transparent.</blockquote>',
      ],
      warnings: [
        { selector: ".article-body h1", category: "relationship-based" },
        { selector: ".article-body p", category: "relationship-based" },
        { selector: ".article-body blockquote", category: "relationship-based" },
      ],
    },
  },
  {
    name: "corpus CMS: WYSIWYG table and image caption",
    html: `
      <div class="cms-content">
        <figure>
          <img class="aligncenter" src="/photo.jpg" alt="" />
          <figcaption>Imported media with a caption</figcaption>
        </figure>
        <table><tbody><tr><td>Plan</td><td>Team</td></tr></tbody></table>
      </div>
    `,
    css: `
      .cms-content figure {
        margin: 0 0 24px;
      }

      .aligncenter {
        display: block;
        margin-left: auto;
        margin-right: auto;
        max-width: 100%;
        height: auto;
      }

      .cms-content figcaption {
        margin-top: 8px;
        color: #6b7280;
        font-size: 14px;
        text-align: center;
      }

      .cms-content table {
        width: 100%;
        border-collapse: collapse;
      }

      .cms-content td {
        padding: 10px;
        border: 1px solid #e5e7eb;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="block mx-auto max-w-full h-auto"',
        '<figcaption class="mt-2 text-gray-500 text-sm text-center">Imported media with a caption</figcaption>',
        '<table class="w-full border-collapse">',
        '<td class="p-2.5 border border-solid border-gray-200">Plan</td>',
      ],
      warnings: [
        { selector: ".cms-content figure", category: "relationship-based" },
        { selector: ".cms-content figcaption", category: "relationship-based" },
        { selector: ".cms-content table", category: "relationship-based" },
        { selector: ".cms-content td", category: "relationship-based" },
      ],
    },
  },
  {
    name: "corpus CMS: embedded widget with animation preserved",
    html: `
      <div class="embed-card">
        <div class="spinner"></div>
        <p>Loading syndicated content</p>
      </div>
    `,
    css: `
      .embed-card {
        max-width: 420px;
        padding: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 4px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 9999px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
    expected: {
      htmlIncludes: [
        'class="max-w-md p-5 border border-solid border-gray-200 rounded-lg"',
        'class="spinner w-8 h-8 border-4 border-solid border-gray-200 border-t-blue-600 rounded-full"',
      ],
      leftoverIncludes: ["animation: spin 1s linear infinite", "@keyframes spin"],
      unsupported: [
        { selector: ".spinner", property: "animation", category: "unsupported-property" },
      ],
      warnings: [
        { selector: "@keyframes spin", category: "keyframes" },
      ],
    },
  },
  {
    name: "corpus WordPress: block media text with alignment classes",
    html: `
      <div class="entry-content">
        <div class="wp-block-media-text alignwide">
          <figure class="wp-block-media-text__media"><img src="/demo.jpg" alt="" /></figure>
          <div class="wp-block-media-text__content">
            <h2>Editorial block</h2>
            <p>Block themes bring generated classes and descendant selectors.</p>
          </div>
        </div>
      </div>
    `,
    css: `
      .entry-content {
        margin: 0 auto;
        max-width: 760px;
      }

      .alignwide {
        max-width: 1100px;
        margin-left: auto;
        margin-right: auto;
      }

      .wp-block-media-text {
        display: grid;
        grid-template-columns: 50% 1fr;
        gap: 32px;
        align-items: center;
      }

      .wp-block-media-text__content h2 {
        font-size: 36px;
        margin-bottom: 12px;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="my-0 mx-auto max-w-3xl"',
        'class="grid grid-cols-[50%_1fr] gap-[32px] items-center max-w-6xl mx-auto"',
        '<h2 class="text-[36px] mb-[12px]">Editorial block</h2>',
      ],
      warnings: [
        { selector: ".wp-block-media-text__content h2", category: "relationship-based" },
      ],
    },
    mode: "exact",
  },
  {
    name: "corpus WordPress: navigation menu with child combinators",
    html: `
      <nav class="main-navigation">
        <ul id="primary-menu" class="menu">
          <li class="menu-item current-menu-item"><a href="/">Home</a></li>
          <li class="menu-item"><a href="/about">About</a></li>
        </ul>
      </nav>
    `,
    css: `
      .main-navigation {
        background: #111827;
        padding: 0 24px;
      }

      .menu {
        display: flex;
        gap: 24px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .menu > .menu-item > a {
        display: block;
        padding: 16px 0;
        color: white;
        text-decoration: none;
      }

      .current-menu-item > a {
        border-bottom: 2px solid #60a5fa;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="bg-gray-900 py-0 px-6"',
        'class="flex gap-6 m-0 p-0 list-none"',
      ],
      leftoverIncludes: [".menu > .menu-item > a", ".current-menu-item > a"],
      preservedRules: [
        { selector: ".menu > .menu-item > a", category: "relationship-based" },
        { selector: ".current-menu-item > a", category: "relationship-based" },
      ],
      warnings: [
        { selector: ".menu > .menu-item > a", category: "relationship-based" },
        { selector: ".current-menu-item > a", category: "relationship-based" },
      ],
    },
  },
  {
    name: "corpus WordPress: gallery block with captions and columns",
    html: `
      <figure class="wp-block-gallery has-nested-images columns-3">
        <figure class="wp-block-image"><img src="/a.jpg" alt="" /><figcaption>One</figcaption></figure>
        <figure class="wp-block-image"><img src="/b.jpg" alt="" /><figcaption>Two</figcaption></figure>
        <figure class="wp-block-image"><img src="/c.jpg" alt="" /><figcaption>Three</figcaption></figure>
      </figure>
    `,
    css: `
      .wp-block-gallery {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin: 32px 0;
      }

      .wp-block-gallery .wp-block-image {
        margin: 0;
      }

      .wp-block-gallery img {
        width: 100%;
        height: auto;
        border-radius: 8px;
      }

      .wp-block-gallery figcaption {
        margin-top: 6px;
        font-size: 13px;
        color: #6b7280;
      }
    `,
    expected: {
      htmlIncludes: [
        'class="wp-block-gallery has-nested-images columns-3 grid grid-cols-3 gap-4 my-8 mx-0"',
        'src="/a.jpg" alt="" class="w-full h-auto rounded-lg"',
        '<figcaption class="mt-1.5 text-xs text-gray-500">One</figcaption>',
      ],
      warnings: [
        { selector: ".wp-block-gallery .wp-block-image", category: "relationship-based" },
        { selector: ".wp-block-gallery img", category: "relationship-based" },
        { selector: ".wp-block-gallery figcaption", category: "relationship-based" },
      ],
    },
  },
];
