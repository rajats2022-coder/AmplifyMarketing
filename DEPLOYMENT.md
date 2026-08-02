# Amplify Outreach deployment checklist

## Required launch configuration

1. Create and verify an Amplify Outreach Formspree form, then set `AMPLIFY_FORMSPREE_FORM_ID` in the Vercel project for Production and Preview.
2. Add `amplifyoutreach.com` and `www.amplifyoutreach.com` to the Vercel project. Replace the current legacy-host DNS records with the exact records Vercel provides.
3. Add the final business email and phone number to the site once the client approves them.
4. Run a real form submission from the preview deployment and confirm receipt in the intended inbox before promoting to production.
5. Verify `/robots.txt`, `/sitemap.xml`, canonical URLs, and a representative sample of pages on the public domain after release.

## Deferred integrations

- Register the website and Search Console property in S4 AI Command Center after its tenant database is connected.
- Add Google Business Profile only after the client grants verified access. Do not create or claim a listing from assumptions.
- Add verified testimonials, campaign results, and organization contact schema only after the client approves the underlying facts.

## Local verification

```sh
npm run build
node /Users/rajatsingh/.codex/skills/home-services-seo-auditor/scripts/audit-index-targets.mjs "$PWD"
```
