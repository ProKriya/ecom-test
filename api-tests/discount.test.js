import { describe, it, expect, beforeEach } from 'vitest';
import { api, resetAll } from './helpers.js';
import { adminDiscountBody, product } from './payloads.js';

beforeEach(resetAll);

describe('Discount API', () => {
  const cartId = 'disc-cart';
  const userId = 'disc-user';

  it('POST /api/discount/apply calculates discount', async () => {
    const codeRes = await api('POST', '/api/admin/discount/generate', { percentage: 10, type: 'manual', maxUsage: 5 });
    const code = codeRes.data.code;

    await api('POST', `/api/cart/${cartId}/items`, { userId, product });
    const { status, data } = await api('POST', '/api/discount/apply', { cartId, discountCode: code });
    expect(status).toBe(200);
    expect(data.discountPercentage).toBe(10);
    expect(data.discountAmount).toBe(5);
    expect(data.finalTotal).toBe(45);
  });

  it('POST /api/discount/apply rejects invalid code', async () => {
    await api('POST', `/api/cart/${cartId}/items`, { userId, product });
    const { status } = await api('POST', '/api/discount/apply', { cartId, discountCode: 'INVALID' });
    expect(status).toBe(404);
  });

  it('POST /api/discount/apply rejects missing fields', async () => {
    const { status } = await api('POST', '/api/discount/apply', {});
    expect(status).toBe(400);
  });
});
