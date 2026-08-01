const REQUIRED_FIELDS = [
  'name',
  'business',
  'email',
  'industry',
  'area',
  'best-service',
  'job-value',
  'message',
];

const ALLOWED_FIELDS = [
  ...REQUIRED_FIELDS,
  'phone',
  'website',
  'lead-goal',
  'ad-spend',
  'lead-source',
  'follow-up',
];

function value(body, field) {
  const raw = body?.[field];
  return typeof raw === 'string' ? raw.trim().slice(0, 4000) : '';
}

function send(response, status, payload) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  return response.status(status).json(payload);
}

module.exports = async function contactHandler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return send(response, 405, { ok: false, error: 'Method not allowed' });
  }

  const body = typeof request.body === 'string'
    ? (() => {
        try {
          return JSON.parse(request.body);
        } catch {
          return null;
        }
      })()
    : request.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return send(response, 400, { ok: false, error: 'Invalid request' });
  }

  const origin = request.headers?.origin;
  const host = request.headers?.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return send(response, 403, { ok: false, error: 'Origin not allowed' });
      }
    } catch {
      return send(response, 403, { ok: false, error: 'Origin not allowed' });
    }
  }

  if (value(body, 'company-url')) {
    return send(response, 200, { ok: true });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !value(body, field));
  if (missing.length || !/^\S+@\S+\.\S+$/.test(value(body, 'email'))) {
    return send(response, 400, { ok: false, error: 'Please complete the required fields' });
  }

  const formId = process.env.AMPLIFY_FORMSPREE_FORM_ID?.trim();
  if (!formId || !/^[a-zA-Z0-9]+$/.test(formId)) {
    return send(response, 503, { ok: false, error: 'Contact delivery is not configured' });
  }

  const payload = Object.fromEntries(
    ALLOWED_FIELDS.map((field) => [field, value(body, field)]).filter(([, fieldValue]) => fieldValue),
  );
  payload._subject = `New Amplify lead-flow audit request from ${payload.business}`;

  try {
    const upstream = await fetch(`https://formspree.io/f/${formId}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (upstream.status === 429) {
      return send(response, 429, { ok: false, error: 'Please wait before trying again' });
    }

    if (!upstream.ok) {
      return send(response, 502, { ok: false, error: 'Contact delivery failed' });
    }

    return send(response, 200, { ok: true });
  } catch {
    return send(response, 502, { ok: false, error: 'Contact delivery failed' });
  }
};
