import { describe, it, expect, beforeEach } from 'vitest';
import { api, resetAll, baseEnv } from './helpers.js';

beforeEach(resetAll);

describe('GET /health', () => {
  it('returns ok status', async () => {
    const { status, data } = await api('GET', '/health');
    expect(status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.apiVersion).toBe('v1');
    expect(data.timestamp).toBeDefined();
  });

  it('returns configured api version', async () => {
    const { status, data } = await api('GET', '/health', undefined, { ...baseEnv, API_VERSION: 'v2' });
    expect(status).toBe(200);
    expect(data.apiVersion).toBe('v2');
  });
});
