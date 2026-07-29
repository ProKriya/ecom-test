const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function requestJSON(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const body = parseResponseBody(await response.text());
  if (!response.ok) {
    const message = body && typeof body === 'object'
      ? body.error || body.message || response.statusText
      : response.statusText;
    const error = new Error(message || 'Request failed');
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value || 0));
}

export function createSessionId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random.slice(0, 8)}`;
}
