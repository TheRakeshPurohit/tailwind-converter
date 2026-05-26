export type ExampleSnippet = {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  result: string;
  html: string;
  css: string;
};

export const exampleSnippets: ExampleSnippet[] = [
  {
    id: "pricing-card",
    name: "Pricing card",
    description:
      "A SaaS pricing section with a featured plan, usage metrics, feature rows, and hover states.",
    highlights: ["pricing", "features", "hover"],
    result: "Mostly clean conversion",
    html: `<section class="pricing-section">
  <div class="pricing-intro">
    <p class="eyebrow">Pro workspace</p>
    <h2>Ship cleaner Tailwind migrations.</h2>
    <p>Everything a small team needs to convert legacy snippets, inspect preserved CSS, and compare output before merging.</p>
  </div>

  <article class="pricing-card">
    <div class="plan-header">
      <div>
        <p class="plan-name">Migration Pro</p>
        <p class="plan-note">For product teams modernizing static pages.</p>
      </div>
      <span class="plan-badge">Popular</span>
    </div>

    <p class="price">$39<span>/seat</span></p>
    <p class="summary">Convert larger snippets, save review context, and keep a clean audit trail for every preserved rule.</p>

    <div class="usage-strip">
      <div>
        <strong>250</strong>
        <span>conversions</span>
      </div>
      <div>
        <strong>8</strong>
        <span>reviewers</span>
      </div>
      <div>
        <strong>24h</strong>
        <span>history</span>
      </div>
    </div>

    <ul class="feature-list">
      <li>Visual preview for original and converted output</li>
      <li>Preserved CSS review grouped by migration risk</li>
      <li>Exact mode for arbitrary values and gradients</li>
    </ul>

    <a class="button" href="#">Start pro trial</a>
    <p class="fine-print">No credit card required. Export HTML anytime.</p>
  </article>
</section>`,
    css: `.pricing-section {
  max-width: 1040px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #f8fafc;
}

.pricing-intro {
  max-width: 640px;
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin-bottom: 0.75rem;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pricing-intro h2 {
  margin-bottom: 1rem;
  color: #111827;
  font-size: 3rem;
  line-height: 1.05;
}

.pricing-intro p {
  color: #475569;
  font-size: 1.125rem;
  line-height: 1.7;
}

.pricing-card {
  max-width: 560px;
  padding: 1.5rem;
  border: 1px solid #dbeafe;
  border-radius: 20px;
  background-color: white;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.pricing-card:hover {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.plan-name {
  color: #111827;
  font-size: 1.25rem;
  font-weight: 800;
}

.plan-note {
  margin-top: 0.25rem;
  color: #64748b;
  line-height: 1.5;
}

.plan-badge {
  height: fit-content;
  padding: 0.375rem 0.625rem;
  border-radius: 9999px;
  background-color: #ecfdf5;
  color: #047857;
  font-size: 0.75rem;
  font-weight: 800;
}

.price {
  margin-bottom: 1rem;
  color: #0f172a;
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: -0.025em;
}

.price span {
  color: #64748b;
  font-size: 1rem;
  font-weight: 500;
}

.summary {
  margin-bottom: 1.25rem;
  color: #475569;
  line-height: 1.625;
}

.usage-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.usage-strip div {
  padding: 0.75rem;
  border-radius: 14px;
  background-color: #eff6ff;
}

.usage-strip strong {
  display: block;
  color: #1d4ed8;
  font-size: 1.25rem;
}

.usage-strip span {
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
}

.feature-list {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-left: 1.25rem;
  color: #334155;
}

.feature-list li {
  padding-left: 0.25rem;
  line-height: 1.5;
}

.button {
  display: inline-flex;
  justify-content: center;
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 9999px;
  background-color: #10b981;
  color: white;
  font-weight: 800;
  text-decoration-line: none;
}

.button:hover {
  background-color: #059669;
}

.fine-print {
  margin-top: 1rem;
  color: #64748b;
  font-size: 0.75rem;
  text-align: center;
}

@media (min-width: 768px) {
  .pricing-section {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 2rem;
    align-items: center;
    padding: 2rem;
  }
}`,
  },
  {
    id: "responsive-navbar",
    name: "Responsive navbar",
    description:
      "A SaaS product navbar with responsive layout, grouped actions, badges, and hover states.",
    highlights: ["responsive", "actions", "hover"],
    result: "Includes responsive variants",
    html: `<header class="app-shell">
  <nav class="site-nav">
    <a class="brand" href="#">
      <span class="brand-mark">TC</span>
      <span>Tailwind Converter</span>
    </a>

    <div class="nav-links">
      <a href="#">Product</a>
      <a href="#">Templates</a>
      <a href="#">Changelog</a>
      <a href="#">Pricing</a>
    </div>

    <div class="nav-actions">
      <span class="status-pill">Beta access</span>
      <a class="login-link" href="#">Log in</a>
      <a class="cta-link" href="#">Start migration</a>
    </div>
  </nav>

  <section class="nav-hero">
    <p class="eyebrow">CSS migration workspace</p>
    <h1>Convert legacy snippets without losing the review trail.</h1>
    <p class="hero-copy">Paste HTML and CSS, compare the generated Tailwind, and keep risky rules visible before they ship.</p>
    <div class="hero-actions">
      <a class="primary-action" href="#">Try converter</a>
      <a class="secondary-action" href="#">View examples</a>
    </div>
  </section>
</header>`,
    css: `.app-shell {
  padding: 1rem;
  background-color: #0f172a;
  color: white;
}

.site-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  background-color: rgba(15, 23, 42, 0.86);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-size: 1.125rem;
  font-weight: 800;
  text-decoration-line: none;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 12px;
  background-color: #2563eb;
  font-size: 0.875rem;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-links a,
.login-link {
  color: #d1d5db;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration-line: none;
}

.nav-links a:hover,
.login-link:hover {
  color: white;
}

.nav-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.375rem 0.625rem;
  border-radius: 9999px;
  background-color: #1e293b;
  color: #93c5fd;
  font-size: 0.75rem;
  font-weight: 700;
}

.cta-link,
.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  background-color: #3b82f6;
  color: white;
  font-weight: 800;
  text-decoration-line: none;
}

.cta-link:hover,
.primary-action:hover {
  background-color: #2563eb;
}

.nav-hero {
  max-width: 760px;
  margin: 4rem auto 2rem;
  text-align: center;
}

.eyebrow {
  margin-bottom: 1rem;
  color: #93c5fd;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav-hero h1 {
  margin-bottom: 1rem;
  font-size: 3rem;
  line-height: 1.05;
}

.hero-copy {
  margin: 0 auto 1.5rem;
  max-width: 620px;
  color: #cbd5e1;
  font-size: 1.125rem;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.secondary-action {
  color: #cbd5e1;
  font-weight: 700;
  text-decoration-line: none;
}

@media (min-width: 768px) {
  .app-shell {
    padding: 1.5rem;
  }

  .site-nav {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
  }

  .nav-links,
  .nav-actions,
  .hero-actions {
    flex-direction: row;
    align-items: center;
  }

  .nav-hero h1 {
    font-size: 4.5rem;
  }
}`,
  },
  {
    id: "signup-form",
    name: "Signup form",
    description:
      "A polished SaaS signup card with plan context, multiple fields, focus states, and trust indicators.",
    highlights: ["forms", "focus", "SaaS"],
    result: "Good exact-mode candidate",
    html: `<section class="signup-page">
  <div class="signup-copy">
    <p class="eyebrow">Team workspace</p>
    <h2>Start a migration review room.</h2>
    <p>Invite designers and engineers to compare converted Tailwind output before it lands in your codebase.</p>
    <div class="proof-row">
      <span>14-day trial</span>
      <span>No credit card</span>
      <span>Export anytime</span>
    </div>
  </div>

  <form class="signup-form">
    <div class="form-header">
      <p>Create workspace</p>
      <span>Pro trial</span>
    </div>

    <div class="field-grid">
      <div>
        <label for="name">Full name</label>
        <input id="name" type="text" placeholder="Avery Stone" />
      </div>
      <div>
        <label for="company">Company</label>
        <input id="company" type="text" placeholder="Northstar Labs" />
      </div>
    </div>

    <div>
      <label for="email">Work email</label>
      <input id="email" type="email" placeholder="avery@northstar.dev" />
    </div>

    <div>
      <label for="role">Migration goal</label>
      <select id="role">
        <option>Convert a marketing site</option>
        <option>Audit generated HTML</option>
        <option>Clean up a design system</option>
      </select>
    </div>

    <label class="checkbox-row">
      <input type="checkbox" checked />
      <span>Send me the migration checklist and product updates.</span>
    </label>

    <button type="submit">Create workspace</button>
    <p class="fine-print">By continuing, you agree to receive onboarding emails.</p>
  </form>
</section>`,
    css: `.signup-page {
  display: grid;
  gap: 2rem;
  max-width: 1040px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #f8fafc;
}

.signup-copy {
  padding: 1rem;
}

.eyebrow {
  margin-bottom: 0.75rem;
  color: #4f46e5;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.signup-copy h2 {
  margin-bottom: 1rem;
  color: #111827;
  font-size: 2.75rem;
  line-height: 1.05;
}

.signup-copy p {
  max-width: 560px;
  color: #475569;
  font-size: 1.125rem;
  line-height: 1.7;
}

.proof-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.proof-row span {
  padding: 0.5rem 0.75rem;
  border: 1px solid #dbeafe;
  border-radius: 9999px;
  background-color: white;
  color: #1d4ed8;
  font-size: 0.875rem;
  font-weight: 700;
}

.signup-form {
  width: 100%;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background-color: white;
  box-shadow: 0 20px 25px -5px rgb(15 23 42 / 0.1);
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.form-header p {
  color: #111827;
  font-size: 1.125rem;
  font-weight: 800;
}

.form-header span {
  padding: 0.375rem 0.625rem;
  border-radius: 9999px;
  background-color: #eef2ff;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 800;
}

.field-grid {
  display: grid;
  gap: 1rem;
}

.signup-form label {
  display: block;
  margin-bottom: 0.5rem;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 700;
}

.signup-form input,
.signup-form select {
  display: block;
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background-color: #f8fafc;
  color: #0f172a;
}

.signup-form input:focus,
.signup-form select:focus {
  border-color: #6366f1;
  outline-width: 2px;
  outline-offset: 2px;
  outline-color: #6366f1;
}

.checkbox-row {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  margin: 0.25rem 0 1rem;
  color: #475569;
}

.checkbox-row input {
  width: auto;
  margin-top: 0.25rem;
  accent-color: #4f46e5;
}

.signup-form button {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  background-color: #4f46e5;
  color: white;
  font-weight: 800;
}

.signup-form button:hover {
  background-color: #4338ca;
}

.fine-print {
  margin-top: 1rem;
  color: #64748b;
  font-size: 0.75rem;
  text-align: center;
}

@media (min-width: 768px) {
  .signup-page {
    grid-template-columns: 1fr 1fr;
    align-items: center;
    padding: 2rem;
  }

  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}`,
  },
  {
    id: "dashboard-widget",
    name: "Dashboard widget",
    description:
      "A SaaS analytics widget with KPI cards, trend rows, grid placement, and preserved pseudo-element CSS.",
    highlights: ["analytics", "grid", "preserved CSS"],
    result: "Shows review workflow",
    html: `<section class="dashboard-card">
  <div class="dashboard-header">
    <div>
      <p class="eyebrow">Workspace health</p>
      <h2>Migration dashboard</h2>
    </div>
    <span class="live-badge">Live</span>
  </div>

  <div class="kpi-grid">
    <article class="kpi-card primary">
      <span>Converted</span>
      <strong>84%</strong>
      <p>Direct utility coverage</p>
    </article>
    <article class="kpi-card">
      <span>Review items</span>
      <strong>12</strong>
      <p>Preserved or approximated</p>
    </article>
    <article class="kpi-card">
      <span>Selectors</span>
      <strong>36</strong>
      <p>Matched safely</p>
    </article>
  </div>

  <div class="trend-panel">
    <div class="trend-row">
      <span class="trend-label">Gradients</span>
      <div class="trend-track"><span class="trend-fill gradients"></span></div>
      <strong>72%</strong>
    </div>
    <div class="trend-row">
      <span class="trend-label">Grid</span>
      <div class="trend-track"><span class="trend-fill grid"></span></div>
      <strong>91%</strong>
    </div>
    <div class="trend-row">
      <span class="trend-label">Review</span>
      <div class="trend-track"><span class="trend-fill review"></span></div>
      <strong>18%</strong>
    </div>
  </div>
</section>`,
    css: `.dashboard-card {
  max-width: 760px;
  margin: 2rem auto;
  padding: 1.25rem;
  border-radius: 20px;
  background: linear-gradient(to bottom right, #111827, #1e293b);
  color: white;
  box-shadow: 0 20px 25px -5px rgb(15 23 42 / 0.25);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.eyebrow {
  margin-bottom: 0.375rem;
  color: #93c5fd;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-header h2 {
  font-size: 1.5rem;
  line-height: 1.2;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.625rem;
  border-radius: 9999px;
  background-color: #064e3b;
  color: #6ee7b7;
  font-size: 0.75rem;
  font-weight: 800;
}

.live-badge::before {
  content: "";
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.375rem;
  border-radius: 9999px;
  background-color: #34d399;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi-card {
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 16px;
  background-color: rgba(15, 23, 42, 0.72);
}

.kpi-card.primary {
  background-color: #2563eb;
}

.kpi-card span {
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-card strong {
  display: block;
  margin-top: 0.5rem;
  font-size: 2.5rem;
  line-height: 1;
}

.kpi-card p {
  margin-top: 0.5rem;
  color: #cbd5e1;
  font-size: 0.875rem;
}

.trend-panel {
  padding: 1rem;
  border-radius: 16px;
  background-color: rgba(15, 23, 42, 0.55);
}

.trend-row {
  display: grid;
  grid-template-columns: 5rem 1fr 3rem;
  gap: 0.75rem;
  align-items: center;
}

.trend-row + .trend-row {
  margin-top: 0.875rem;
}

.trend-label {
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 700;
}

.trend-track {
  height: 0.5rem;
  overflow: hidden;
  border-radius: 9999px;
  background-color: #334155;
}

.trend-fill {
  display: block;
  height: 100%;
  border-radius: 9999px;
  background-color: #60a5fa;
}

.trend-fill.gradients {
  width: 72%;
}

.trend-fill.grid {
  width: 91%;
  background-color: #34d399;
}

.trend-fill.review {
  width: 18%;
  background-color: #f59e0b;
}

.trend-row strong {
  color: #e2e8f0;
  font-size: 0.875rem;
  text-align: right;
}

@media (min-width: 768px) {
  .dashboard-card {
    padding: 1.5rem;
  }

  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}`,
  },
];
