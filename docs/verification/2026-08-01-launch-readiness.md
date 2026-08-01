# Amplify Outreach launch-readiness verification

Date: August 1, 2026

## Local website result

- Removed the retired fixed management price from visible copy, metadata, JSON-LD, the budget calculator, chatbot responses, FAQs, research guidance, and AI-readable summaries.
- Reframed `/pricing` as a consultative working-together page while preserving the existing clean URL and internal-link equity.
- Added the founder About section and linked the verified Instagram profile.
- Replaced the form's simulated success with a validated `/api/contact` function that forwards to Formspree only after confirmed configuration. Validation, honeypot handling, same-origin protection, upstream errors, rate limits, and fail-closed behavior are covered by local tests.
- Added privacy and terms pages, legal footer links, preview-branding cleanup, a custom 404 page, favicon metadata, a 1200 x 630 social card, and deployment security headers.
- Added reusable deterministic checks in `scripts/verify-site.mjs` and `scripts/test-contact-handler.mjs`.

## Verification evidence

- `npm test`: passed JavaScript syntax checks, contact-handler tests, and full site verification.
- `npm run build`: passed.
- SEO/index audit: 28 sitemap URLs, 0 missing local files, 0 zero-inbound pages, 0 thin pages at the configured threshold, and 0 highly similar pairs.
- Independent crawl: 28/28 clean sitemap routes returned HTTP 200 locally; no broken internal links or images; no invalid JSON-LD; unique titles, descriptions, canonicals, OG metadata, Twitter metadata, and one H1 on every indexable page.
- Mobile browser matrix: all 29 HTML pages passed at 390 x 844 and 320 x 568 with exact viewport width, no page overflow, no broken images, and no console/runtime errors.
- Navigation and chat passed touch-target, Escape, focus-return, and modal focus-containment checks.
- The two-step contact form preserved all step-one and step-two values in the outgoing JSON payload. A failed local endpoint kept the form values and showed an error instead of claiming success.
- `git diff --check`: passed.

## S4 AI Command Center result

- The canonical Command Center app was healthy locally on port 3000.
- Its local tenant data and Hermes worker connection were offline, and Amplify Outreach was not registered in the client automation registry.
- The no-write daily preview checked the 27 existing registered operations and reported none needing attention. It did not audit Amplify and must not be represented as doing so.
- No Command Center files, provider state, client records, publishing systems, or external accounts were changed.

## External activation gates

1. Create and verify the Amplify Formspree form, set `AMPLIFY_FORMSPREE_FORM_ID` in Vercel, and confirm a real preview submission reaches the approved inbox.
2. Attach `amplifyoutreach.com` and `www.amplifyoutreach.com` to the Vercel project and replace the legacy DNS records. Current live state: both hosts resolve to `162.215.226.3`; HTTP returns 503 and HTTPS does not accept a connection.
3. Add the client-approved business email and phone number when supplied.
4. Register Amplify as a tenant-scoped Command Center client after the local database and worker connection are available.
5. Register and verify Search Console after domain ownership is live. Leave Google Business Profile unregistered until the client grants verified access.
6. After deployment, recheck public HTTP status, TLS, robots, sitemap, canonicals, form receipt, and representative mobile pages.

No deployment, publication, account claim, form submission, or outbound message was performed during this pass.
