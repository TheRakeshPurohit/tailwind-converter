import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Browser } from "playwright";
import {
  launchVisualRegressionBrowser,
  runVisualRegressionCase,
  type VisualRegressionCase,
  type VisualRegressionResult,
} from "./visual-harness";

const visualCases: VisualRegressionCase[] = [
  {
    name: "spacing typography and color baseline",
    html: `
      <main class="page">
        <section class="hero">
          <h1>Build faster</h1>
          <p>Convert plain CSS into reviewable Tailwind classes.</p>
        </section>
      </main>
    `,
    css: `
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        color: #111827;
        background: #ffffff;
      }

      .page {
        padding: 32px;
      }

      .hero {
        max-width: 768px;
        margin: 0 auto;
        padding: 24px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      h1 {
        margin: 0 0 16px;
        font-size: 32px;
        line-height: 1.25;
        font-weight: 700;
      }

      p {
        margin: 0;
        font-size: 18px;
        line-height: 1.5;
        color: #4b5563;
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "exact mode keeps arbitrary layout values",
    mode: "exact",
    html: `
      <article class="card">
        <h2>Dashboard Preview</h2>
        <p>Rounded corners and shadow should stay close.</p>
      </article>
    `,
    css: `
      body {
        margin: 0;
        padding: 40px;
        background: #f5f7fb;
      }

      .card {
        width: 420px;
        padding: 30px;
        border-radius: 20px;
        background: white;
        box-shadow: 0 15px 35px rgba(0, 0, 0, .08);
      }

      h2 {
        margin: 0 0 12px;
        font-size: 28px;
      }

      p {
        margin: 0;
        color: #666;
        line-height: 1.7;
      }
    `,
    maxMismatchRatio: 0.04,
  },
  {
    name: "compound background shorthand decomposition",
    mode: "exact",
    html: `
      <section class="promo">
        <span>Release</span>
        <h1>Backgrounds stay layered.</h1>
      </section>
    `,
    css: `
      body {
        margin: 0;
        padding: 32px;
        background: #f9fafb;
      }

      .promo {
        min-height: 220px;
        padding: 32px;
        color: #ffffff;
        border-radius: 18px;
        background: linear-gradient(135deg, #2563eb, #0f8f99) center / cover no-repeat fixed #111827;
      }

      span {
        display: inline-block;
        margin-bottom: 48px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
        background: #ffffff;
        border-radius: 9999px;
      }

      h1 {
        max-width: 420px;
        margin: 0;
        font-size: 36px;
        line-height: 1.08;
      }
    `,
    maxMismatchRatio: 0.04,
  },
  {
    name: "responsive dashboard layout",
    html: `
      <main class="dashboard">
        <header class="toolbar">
          <h1>Reports</h1>
          <button class="filter">Filter</button>
        </header>
        <section class="panel">Revenue</section>
        <section class="panel">Pipeline</section>
      </main>
    `,
    css: `
      body {
        margin: 0;
        background: #f9fafb;
        color: #111827;
      }

      .dashboard {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }

      .filter {
        padding: 8px 16px;
        background: #2563eb;
        color: white;
        border: 0;
        border-radius: 6px;
      }

      .panel {
        padding: 16px;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 8px;
      }

      @media (min-width: 768px) {
        .dashboard {
          padding: 32px;
        }

        .panel {
          padding: 24px;
        }
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "grid card matrix",
    html: `
      <section class="stats-grid">
        <article class="stat"><span>Users</span><strong>12k</strong></article>
        <article class="stat"><span>Revenue</span><strong>$24k</strong></article>
        <article class="stat"><span>Growth</span><strong>18%</strong></article>
        <article class="stat"><span>Retention</span><strong>91%</strong></article>
      </section>
    `,
    css: `
      body {
        margin: 0;
        padding: 32px;
        background: #f3f4f6;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        max-width: 768px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 20px;
        background: white;
        border-radius: 12px;
      }

      span {
        color: #4b5563;
        font-size: 14px;
      }

      strong {
        font-size: 30px;
        font-weight: 700;
        color: #111827;
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "form controls and inline actions",
    html: `
      <form class="form">
        <label class="field">
          <span>Email</span>
          <input class="input" value="team@example.com" />
        </label>
        <button class="submit">Invite</button>
      </form>
    `,
    css: `
      body {
        margin: 0;
        padding: 32px;
        background: #ffffff;
        color: #111827;
      }

      .form {
        display: flex;
        align-items: end;
        gap: 12px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      span {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .input {
        width: 288px;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 16px;
      }

      .submit {
        padding: 8px 16px;
        background: #111827;
        color: white;
        border: 0;
        border-radius: 6px;
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "hover and focus variants",
    html: `
      <nav class="nav">
        <a class="link" href="#">Overview</a>
        <a class="link" href="#">Settings</a>
      </nav>
    `,
    css: `
      body {
        margin: 0;
        padding: 32px;
      }

      .nav {
        display: flex;
        gap: 16px;
      }

      .link {
        color: #4b5563;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 6px;
      }

      .link:hover {
        color: #2563eb;
        background-color: #f3f4f6;
      }

      .link:focus {
        color: #111827;
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "navigation header with descendants",
    html: `
      <header class="site-header">
        <a class="brand" href="#">Northstar</a>
        <nav class="nav">
          <ul class="nav-list">
            <li><a href="#">Product</a></li>
            <li><a href="#">Docs</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </nav>
        <a class="account-link" href="#">Sign in</a>
      </header>
    `,
    css: `
      body {
        margin: 0;
        background: #ffffff;
        color: #111827;
      }

      .site-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        min-width: 0;
        padding: 16px 24px;
        border-bottom: 1px solid #e5e7eb;
        overflow: hidden;
      }

      .brand {
        flex: 1;
        color: #111827;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0.025em;
        text-decoration: none;
      }

      .nav-list {
        display: flex;
        gap: 20px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .nav-list a {
        color: #4b5563;
        cursor: pointer;
        font-size: 14px;
        text-decoration: none;
        white-space: nowrap;
      }

      .nav-list a:hover {
        color: #2563eb;
      }

      .account-link {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        color: #111827;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "transformed badge composition",
    html: `
      <section class="stage">
        <div class="badge">New</div>
      </section>
    `,
    css: `
      body {
        margin: 0;
        padding: 48px;
        background: #ffffff;
      }

      .stage {
        position: relative;
        width: 240px;
        height: 160px;
        border: 1px solid #e5e7eb;
      }

      .badge {
        position: absolute;
        top: 64px;
        left: 80px;
        padding: 8px 16px;
        background: #2563eb;
        color: white;
        border-radius: 8px;
        transform: translateX(12px) translateY(-50%) rotate(6deg) scale(1.05);
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "filtered panel composition",
    html: `
      <section class="filter-stage">
        <div class="filter-card">Filtered</div>
      </section>
    `,
    css: `
      body {
        margin: 0;
        padding: 48px;
        background: white;
      }

      .filter-stage {
        width: 280px;
        height: 180px;
        background: #f3f4f6;
        padding: 32px;
      }

      .filter-card {
        width: 160px;
        height: 96px;
        padding: 16px;
        background: #2563eb;
        color: white;
        border-radius: 12px;
        filter: blur(8px) brightness(1.1) contrast(95%) saturate(1.5);
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "preserved unsupported animation does not distort layout",
    html: `
      <section class="notice">
        <h2>Import complete</h2>
        <p>Unsupported animation should remain in leftover CSS.</p>
      </section>
    `,
    css: `
      body {
        margin: 0;
        padding: 32px;
        background: #ffffff;
      }

      .notice {
        padding: 20px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        animation: pulse 1s infinite;
      }

      h2 {
        margin: 0 0 8px;
        font-size: 24px;
      }

      p {
        margin: 0;
        color: #4b5563;
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "spacing shorthand with auto centering",
    html: `
      <section class="shell">
        <article class="panel">Centered content</article>
      </section>
    `,
    css: `
      body {
        margin: 0;
        background: #f9fafb;
      }

      .shell {
        max-width: 1024px;
        margin: 64px auto;
        padding: 0 32px;
      }

      .panel {
        padding: 24px 32px;
        background: white;
        border-radius: 8px;
      }
    `,
    maxMismatchRatio: 0.08,
  },
  {
    name: "exact mode preserves fractional typography",
    mode: "exact",
    html: `
      <section class="copy">
        <h1>Careful conversion</h1>
        <p>Exact mode should keep uncommon font sizes and line heights.</p>
      </section>
    `,
    css: `
      body {
        margin: 0;
        padding: 40px;
        color: #222;
      }

      .copy {
        max-width: 640px;
      }

      h1 {
        margin: 0 0 18px;
        font-size: 37px;
        line-height: 1.12;
      }

      p {
        margin: 0;
        font-size: 17px;
        line-height: 1.72;
        color: #666;
      }
    `,
    maxMismatchRatio: 0.04,
  },
];

describe("visual regression harness", () => {
  let browser: Browser;
  const visualResults: Array<{
    result: VisualRegressionResult;
    maxMismatchRatio: number;
  }> = [];

  const percent = (ratio: number) => `${(ratio * 100).toFixed(2)}%`;

  const logVisualSummary = () => {
    if (visualResults.length === 0) return;

    const averageMismatch =
      visualResults.reduce(
        (total, { result }) => total + result.mismatchRatio,
        0
      ) / visualResults.length;
    const worst = visualResults.reduce((currentWorst, entry) =>
      entry.result.mismatchRatio > currentWorst.result.mismatchRatio
        ? entry
        : currentWorst
    );
    const resultsByCase = visualResults.reduce(
      (groups, entry) => {
        const current = groups.get(entry.result.name) ?? [];
        current.push(entry);
        groups.set(entry.result.name, current);
        return groups;
      },
      new Map<string, typeof visualResults>()
    );
    const caseLines = Array.from(resultsByCase.entries()).map(
      ([name, entries]) => {
        const mismatch =
          entries.reduce(
            (total, { result }) => total + result.mismatchRatio,
            0
          ) / entries.length;
        const viewportSummary = entries
          .map(
            ({ result }) =>
              `${result.viewport.name} ${percent(result.mismatchRatio)}`
          )
          .join(", ");

        return `  - ${name}: ${percent(1 - mismatch)} accuracy (${viewportSummary})`;
      }
    );

    console.log(
      [
        "",
        "Visual regression summary",
        `Overall accuracy: ${percent(1 - averageMismatch)} across ${visualResults.length} viewport snapshots`,
        `Worst result: ${worst.result.name} / ${worst.result.viewport.name} at ${percent(worst.result.accuracy)} accuracy`,
        `Worst budget: ${percent(worst.maxMismatchRatio)} max mismatch, actual ${percent(worst.result.mismatchRatio)}`,
        `Worst artifacts: ${worst.result.artifacts.diff}`,
        ...caseLines,
        "",
      ].join("\n")
    );
  };

  beforeAll(async () => {
    browser = await launchVisualRegressionBrowser();
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
    logVisualSummary();
  });

  test.each(visualCases)(
    "$name stays within visual mismatch budget",
    async (visualCase) => {
      const { results } = await runVisualRegressionCase(browser, visualCase);
      const maxMismatchRatio = visualCase.maxMismatchRatio ?? 0.05;

      results.forEach((result) => {
        visualResults.push({ result, maxMismatchRatio });
      });

      results.forEach((result) => {
        expect(
          result.mismatchRatio,
          [
            `${result.name} exceeded visual mismatch budget for ${result.viewport.name}.`,
            `Mismatch: ${(result.mismatchRatio * 100).toFixed(2)}%`,
            `Accuracy: ${(result.accuracy * 100).toFixed(2)}%`,
            `Original: ${result.artifacts.original}`,
            `Converted: ${result.artifacts.converted}`,
            `Diff: ${result.artifacts.diff}`,
          ].join("\n")
        ).toBeLessThanOrEqual(maxMismatchRatio);
      });
    },
    30_000
  );
});
