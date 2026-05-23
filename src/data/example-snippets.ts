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
      "A clean component with spacing, color, borders, shadows, and hover state.",
    highlights: ["spacing", "colors", "hover"],
    result: "Mostly clean conversion",
    html: `<section class="pricing-card">
  <p class="eyebrow">Starter</p>
  <h2>Launch faster</h2>
  <p class="price">$19<span>/mo</span></p>
  <p class="summary">Everything you need to convert small landing pages and prototypes.</p>
  <a class="button" href="#">Start converting</a>
</section>`,
    css: `.pricing-card {
  max-width: 360px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.pricing-card:hover {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.eyebrow {
  margin-bottom: 0.5rem;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pricing-card h2 {
  margin-bottom: 1rem;
  color: #111827;
  font-size: 2rem;
  line-height: 1.2;
}

.price {
  margin-bottom: 1rem;
  color: #111827;
  font-size: 3rem;
  font-weight: 800;
}

.price span {
  color: #6b7280;
  font-size: 1rem;
  font-weight: 400;
}

.summary {
  margin-bottom: 1.5rem;
  color: #4b5563;
  line-height: 1.625;
}

.button {
  display: inline-block;
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  background-color: #10b981;
  color: white;
  font-weight: 700;
  text-decoration-line: none;
}`,
  },
  {
    id: "responsive-navbar",
    name: "Responsive navbar",
    description:
      "Shows flex layout, descendant selectors, hover variants, and a Tailwind breakpoint.",
    highlights: ["flex", "media query", "hover"],
    result: "Includes responsive variants",
    html: `<nav class="site-nav">
  <a class="brand" href="#">Tailwind Converter</a>
  <div class="nav-links">
    <a href="#">Examples</a>
    <a href="#">Docs</a>
    <a href="#">GitHub</a>
  </div>
</nav>`,
    css: `.site-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #111827;
}

.brand {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration-line: none;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-links a {
  color: #d1d5db;
  text-decoration-line: none;
}

.nav-links a:hover {
  color: white;
}

@media (min-width: 768px) {
  .site-nav {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
  }

  .nav-links {
    flex-direction: row;
    align-items: center;
  }
}`,
  },
  {
    id: "signup-form",
    name: "Signup form",
    description:
      "Good for form spacing, labels, inputs, focus states, and exact colors.",
    highlights: ["forms", "focus", "exact values"],
    result: "Good exact-mode candidate",
    html: `<form class="signup-form">
  <div>
    <label for="email">Email address</label>
    <input id="email" type="email" placeholder="you@example.com" />
  </div>
  <button type="submit">Join waitlist</button>
</form>`,
    css: `.signup-form {
  width: 100%;
  max-width: 420px;
  margin: 2rem auto;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: #f9fafb;
}

.signup-form label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
}

.signup-form input {
  display: block;
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background-color: white;
  color: #111827;
}

.signup-form input:focus {
  border-color: #6366f1;
  outline-width: 2px;
  outline-offset: 2px;
  outline-color: #6366f1;
}

.signup-form button {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background-color: #4f46e5;
  color: white;
  font-weight: 700;
}`,
  },
  {
    id: "dashboard-widget",
    name: "Dashboard widget",
    description:
      "A denser UI sample with grid, badges, percentages, and preserved pseudo-element CSS.",
    highlights: ["grid", "badges", "preserved CSS"],
    result: "Shows review workflow",
    html: `<section class="metric-card">
  <div class="metric-header">
    <p>Conversion coverage</p>
    <span>Live</span>
  </div>
  <div class="metric-grid">
    <strong>84%</strong>
    <p>Converted directly</p>
  </div>
</section>`,
    css: `.metric-card {
  max-width: 420px;
  margin: 2rem auto;
  padding: 1rem;
  border-radius: 14px;
  background-color: #111827;
  color: white;
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.metric-header p {
  color: #d1d5db;
  font-size: 0.875rem;
}

.metric-header span {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background-color: #064e3b;
  color: #6ee7b7;
  font-size: 0.75rem;
  font-weight: 700;
}

.metric-header span::before {
  content: "";
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.375rem;
  border-radius: 9999px;
  background-color: #34d399;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: 1rem;
}

.metric-grid strong {
  font-size: 3rem;
  line-height: 1;
}

.metric-grid p {
  color: #9ca3af;
  text-align: right;
}`,
  },
];
