import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/contact.js');

function responseMock() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

async function run(request) {
  const response = responseMock();
  await handler(request, response);
  return response;
}

const method = await run({ method: 'GET' });
if (method.statusCode !== 405) throw new Error('GET should return 405');

const invalid = await run({ method: 'POST', body: {} });
if (invalid.statusCode !== 400) throw new Error('Missing required fields should return 400');

const missingPhone = await run({
  method: 'POST',
  body: { name: 'Test User', email: 'test@example.com' },
});
if (missingPhone.statusCode !== 400) throw new Error('Phone should be required');

const honeypot = await run({ method: 'POST', body: { 'company-url': 'spam.example' } });
if (honeypot.statusCode !== 200) throw new Error('Honeypot should silently accept');

const crossOrigin = await run({
  method: 'POST',
  headers: { origin: 'https://spam.example', host: 'amplifyoutreach.com' },
  body: {},
});
if (crossOrigin.statusCode !== 403) throw new Error('Cross-origin requests should return 403');

delete process.env.AMPLIFY_FORMSPREE_FORM_ID;
const valid = await run({
  method: 'POST',
  body: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '919-555-0100',
  },
});
if (valid.statusCode !== 503) throw new Error('Unconfigured delivery should fail closed with 503');

process.env.AMPLIFY_FORMSPREE_FORM_ID = 'testform';
const originalFetch = globalThis.fetch;
let forwardedRequest;
globalThis.fetch = async (url, options) => {
  forwardedRequest = { url, options };
  return { ok: true, status: 200 };
};
const delivered = await run({
  method: 'POST',
  headers: { origin: 'https://amplifyoutreach.com', host: 'amplifyoutreach.com' },
  body: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '919-555-0100',
  },
});
globalThis.fetch = originalFetch;
delete process.env.AMPLIFY_FORMSPREE_FORM_ID;
if (delivered.statusCode !== 200 || delivered.payload?.ok !== true) throw new Error('Configured delivery should return 200');
if (forwardedRequest?.url !== 'https://formspree.io/f/testform') throw new Error('Delivery should use the configured Formspree endpoint');
if (forwardedRequest.options?.method !== 'POST') throw new Error('Delivery should POST to Formspree');
const forwardedPayload = JSON.parse(forwardedRequest.options?.body ?? '{}');
if (forwardedPayload.email !== 'test@example.com') throw new Error('Delivery should forward the email field');
if (forwardedPayload.phone !== '919-555-0100') throw new Error('Delivery should forward the phone field');
if ('business' in forwardedPayload) throw new Error('Business should remain optional');
if (forwardedPayload._subject !== 'New Amplify lead from Test User') throw new Error('Delivery should fall back to the lead name in the subject');

console.log('Contact handler tests passed: simple required fields, optional business, validation, origin, honeypot, fail-closed configuration, and Formspree delivery payload.');
