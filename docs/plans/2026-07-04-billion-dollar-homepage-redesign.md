# Billion-Dollar Homepage Redesign Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Amplify Outreach homepage so the first viewport feels premium, logo-led, animated, and conversion-focused without adding heavy frontend dependencies.

**Architecture:** Keep the static HTML/CSS/JS stack. Replace the cluttered hero collage with one cinematic generated image, the real AMP logo as the central brand object, one conversion CTA path, and lightweight CSS/IntersectionObserver motion.

**Tech Stack:** Static HTML, vanilla CSS, vanilla JavaScript, existing Lucide runtime, generated PNG asset, local Node preview server.

---

### Task 1: Add Premium Hero Asset

**Files:**
- Create: `assets/images/amplify-hero-growth-system.png`
- Modify: `index.html`
- Modify: `assets/styles.css`

**Steps:**
1. Copy the generated abstract growth-system image into `assets/images/`.
2. Replace the current right-side dashboard collage with a logo-centered hero stage.
3. Keep the real AMP logo as the visible brand mark.
4. Add a compact audit snapshot and subtle signal path around the logo.

### Task 2: Simplify First Viewport

**Files:**
- Modify: `index.html`
- Modify: `assets/styles.css`

**Steps:**
1. Remove the marquee from the homepage.
2. Move the proof tiles into a calm strip below the hero.
3. Keep one primary CTA and one quiet secondary CTA.
4. Remove repeated hero-adjacent sections that say the same thing.

### Task 3: Add Lightweight Motion

**Files:**
- Modify: `assets/styles.css`
- Modify: `assets/script.js`

**Steps:**
1. Add CSS-variable reveal delays.
2. Animate only `transform` and `opacity`.
3. Add one-time logo-stage entrance and subtle signal-line motion.
4. Respect `prefers-reduced-motion`.

### Task 4: Make Homepage Sections More Premium

**Files:**
- Modify: `index.html`
- Modify: `assets/styles.css`

**Steps:**
1. Add an “operating system” section that explains audit, campaign, qualify, book, scale.
2. Keep the lead math calculator as the conversion-support tool.
3. Keep industries, pricing, and final CTA paths visible without overloading the hero.

### Task 5: Validate

**Files:**
- Verify: `index.html`
- Verify: `assets/styles.css`
- Verify: `assets/script.js`

**Steps:**
1. Run `node --check assets/script.js`.
2. Run the static local-link and JSON-LD audit.
3. Verify all sitemap URLs return `200`.
4. Capture desktop and mobile screenshots for the homepage.
