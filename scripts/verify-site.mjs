import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const note = (condition, message) => {
  if (!condition) failures.push(message);
};

const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(https:\/\/amplifyoutreach\.com(?:\/[^<]*)?)<\/loc>/g)].map((match) => match[1]);
note(urls.length > 0, 'sitemap.xml contains no Amplify URLs');
note(new Set(urls).size === urls.length, 'sitemap.xml contains duplicate URLs');

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const file = pathname === '/' ? 'index.html' : `${pathname.slice(1)}.html`;
  const filePath = join(root, file);
  note(existsSync(filePath), `${url} has no local ${file}`);
  if (!existsSync(filePath)) continue;

  const html = readFileSync(filePath, 'utf8');
  const titleCount = (html.match(/<title>[^<]+<\/title>/g) || []).length;
  const h1Count = (html.match(/<h1(?:\s[^>]*)?>/g) || []).length;
  const expectedCanonical = `https://amplifyoutreach.com${pathname}`;

  note(titleCount === 1, `${file} must have one title`);
  note(h1Count === 1, `${file} must have one H1`);
  note(/<meta name="description" content="[^"]+"\s*\/>/.test(html), `${file} is missing a meta description`);
  note(html.includes(`<link rel="canonical" href="${expectedCanonical}" />`), `${file} canonical does not match ${expectedCanonical}`);
  note(html.includes('og:image" content="https://amplifyoutreach.com/assets/images/amplify-og-card.png"'), `${file} is missing the OG card`);
  note(html.includes('twitter:image" content="https://amplifyoutreach.com/assets/images/amplify-og-card.png"'), `${file} is missing the Twitter card image`);
  note(html.includes('href="privacy"') && html.includes('href="terms"'), `${file} is missing legal links`);

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch {
      failures.push(`${file} contains invalid JSON-LD`);
    }
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|tel:|#|data:|\/api\/)/.test(target)) continue;
    const clean = target.split('#')[0].split('?')[0];
    if (!clean || clean === '/') continue;
    const candidate = clean.startsWith('assets/') || /\.[a-z0-9]+$/i.test(clean)
      ? join(root, clean)
      : join(root, `${clean}.html`);
    note(existsSync(candidate), `${file} links to missing ${clean}`);
  }
}

const publicSources = [
  ...readdirSync(root).filter((file) => /\.(?:html|txt)$/.test(file)),
  'assets/script.js',
  'assets/styles.css',
].map((file) => [file, readFileSync(join(root, file), 'utf8')]);

for (const [file, content] of publicSources) {
  note(!/\$750|"price"\s*:\s*"750"|managementFee\s*=\s*750/.test(content), `${file} still exposes the retired fixed price`);
  note(!/Built for preview by S4 AI Agency|Lead-flow audit preview/.test(content), `${file} still contains preview branding`);
}

const contact = readFileSync(join(root, 'contact.html'), 'utf8');
note(contact.includes('action="/api/contact" method="post"'), 'contact form is not wired to /api/contact');
for (const field of ['name', 'email', 'phone']) {
  note(new RegExp(`name="${field}"[^>]*required`).test(contact), `contact form should require ${field}`);
}
note(contact.includes('name="business"'), 'contact form is missing the optional business field');
note(!/name="business"[^>]*required/.test(contact), 'business should be optional');
note(!/name="(?:industry|area|best-service|job-value|message)"/.test(contact), 'contact capture still contains long-form audit fields');
note(contact.includes('data-lead-flow') && contact.includes('data-lead-calculator'), 'contact flow should reveal the lead calculator after capture');
note(existsSync(join(root, 'api/contact.js')), 'contact API handler is missing');
note(existsSync(join(root, 'assets/images/amplify-og-card.png')), 'OG card image is missing');

const homepage = readFileSync(join(root, 'index.html'), 'utf8');
const homepageScript = readFileSync(join(root, 'assets/script.js'), 'utf8');
const motionHeroIndex = homepage.indexOf('class="hero motion-hero"');
const aboutIndex = homepage.indexOf('id="about"');
const proofIndex = homepage.indexOf('proof-strip-after-about');
note(motionHeroIndex >= 0, 'homepage is missing the lead-signal motion hero');
note(homepage.includes('data-motion-hero'), 'homepage motion hero hook is missing');
note(homepage.includes('data-motion-stage'), 'homepage interactive motion stage is missing');
note(homepage.includes('data-lead-signal-field'), 'homepage animated lead-signal background is missing');
note(homepage.includes('motion-node-attract'), 'homepage motion system is missing the attract stage');
note(homepage.includes('motion-node-qualify'), 'homepage motion system is missing the qualify stage');
note(homepage.includes('motion-node-book'), 'homepage motion system is missing the book stage');
note((homepage.match(/data-motion-node=/g) || []).length === 3, 'homepage should expose three interactive lead-stage controls');
note(homepage.includes('assets/images/amplify-outreach-logo.jpeg'), 'homepage motion system is missing the branded AMP logo');
note(homepageScript.includes('initMotionHero()'), 'homepage pointer-motion controller is missing');
note(homepageScript.includes('initLeadSignalField()'), 'homepage lead-signal background controller is missing');
note(motionHeroIndex < aboutIndex && aboutIndex < proofIndex, 'homepage should flow from the hero directly into About before the proof strip');
note(!homepage.includes('data-scroll-hero'), 'homepage still contains the retired scroll-animation hook');
note(!homepage.includes('data-scroll-story-video'), 'homepage still loads the retired scroll-story video');
note(!homepageScript.includes('initScrollHero()'), 'homepage script still initializes the retired scroll animation');
note(!homepage.includes('class="hero cinematic-hero"'), 'homepage still uses the retired cinematic hero');

if (failures.length) {
  console.error(`Site verification failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Site verification passed: ${urls.length} sitemap pages, metadata, JSON-LD, internal targets, legal links, form wiring, and price removal.`);
