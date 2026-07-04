# Amplify Site Expansion Pass Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the Amplify Outreach website beyond the first Meta ads redesign by fixing the homepage campaign rail and adding deeper service, industry, pricing, and results pages.

**Architecture:** Keep the existing static HTML/CSS/JS stack. Add focused SEO pages that link from the current hubs instead of expanding the main navigation. Keep claims conservative and avoid fake testimonials or fake case-study numbers.

**Tech Stack:** Static HTML, vanilla CSS, vanilla JavaScript, local Node preview server.

---

### Task 1: Clean Homepage Campaign Rail

**Files:**
- Modify: `index.html`
- Modify: `assets/styles.css`

**Steps:**
1. Replace the five individual route boxes with one connected campaign rail.
2. Style the rail as a single glass panel with numbered steps.
3. Add mobile timeline rules so the rail stacks cleanly.
4. Capture desktop and mobile screenshots.

### Task 2: Add Deeper Service Pages

**Files:**
- Created: `lead-flow-audit.html`
- Created: `facebook-lead-forms-home-services.html`
- Created: `meta-ad-creative-testing-home-services.html`
- Created: `meta-retargeting-home-services.html`

**Steps:**
1. Build pages with unique titles, meta descriptions, canonical URLs, breadcrumbs, service schema, and CTA sections.
2. Link each page from `services.html` and relevant footer/hub areas.
3. Add each page to `sitemap.xml`, `llms.txt`, and `llms-full.txt`.

### Task 3: Add Deeper Industry Pages

**Files:**
- Created: `lawn-care-marketing.html`
- Created: `hardscaping-marketing.html`
- Created: `pressure-washing-marketing.html`
- Created: `roof-washing-soft-washing-marketing.html`
- Created: `commercial-exterior-cleaning-marketing.html`
- Created: `estate-cleanout-junk-removal-marketing.html`

**Steps:**
1. Build one campaign-angle page per core vertical.
2. Include service-specific lead-form questions, ad angles, and bad-fit filters.
3. Link each page from the matching industry page and `industries.html`.

### Task 4: Add Pricing and Results Support Pages

**Files:**
- Created: `meta-ads-cost-home-services.html`
- Created: `home-service-ad-budget-calculator.html`
- Created: `sample-meta-ads-scorecard.html`
- Created: `lead-quality-scorecard-home-services.html`
- Created: `first-60-days-meta-ads.html`

**Steps:**
1. Build pages that support buying objections and reporting proof.
2. Link pricing pages from `pricing.html`.
3. Link results pages from `results.html`.

### Task 5: Validate

**Files:**
- Modify: `sitemap.xml`
- Modify: `llms.txt`
- Modify: `llms-full.txt`

**Steps:**
1. Run JavaScript syntax check.
2. Audit all local links and JSON-LD.
3. Verify all local URLs return `200`.
4. Capture screenshots for the homepage, services hub, and at least one new page.
