import { describe, it, expect, beforeEach } from 'vitest';
import { api, resetAll } from './helpers.js';
import { adminDiscountBody, adminDiscountNthBody, product } from './payloads.js';

beforeEach(resetAll);

describe('Admin API', () => {
  const cartId = 'admin-cart';
  const userId = 'admin-user';

  it('GET /api/admin/analytics returns metrics', async () => {
    const { status, data } = await api('GET', '/api/admin/analytics');
    expect(status).toBe(200);
    expect(data.totalOrders).toBe(0);
    expect(data.totalRevenue).toBe(0);
    expect(data.totalDiscountsGiven).toBe(0);
  });

  it('POST /api/admin/discount/generate creates code', async () => {
    const { status, data } = await api('POST', '/api/admin/discount/generate', adminDiscountBody);
    expect(status).toBe(200);
    expect(data.code).toBeDefined();
    expect(data.code.length).toBe(8);
    expect(data.details.percentage).toBe(15);
    expect(data.details.type).toBe('manual');
  });

  it('GET /api/admin/analytics reflects order after checkout', async () => {
    await api('POST', `/api/cart/${cartId}/items`, { userId, product });
    await api('POST', `/api/checkout/${cartId}`, { userId });
    const { data } = await api('GET', '/api/admin/analytics');
    expect(data.totalOrders).toBe(1);
    expect(data.totalRevenue).toBe(50);
  });

  it('POST /api/admin/discount/generate rejects missing percentage', async () => {
    const { status } = await api('POST', '/api/admin/discount/generate', { type: 'manual' });
    expect(status).toBe(400);
  });

  it('POST /api/admin/discount/generate creates nth_order type', async () => {
    const { status, data } = await api('POST', '/api/admin/discount/generate', adminDiscountNthBody);
    expect(status).toBe(200);
    expect(data.details.type).toBe('nth_order');
  });

  it('GET /api/admin/analytics tracks discount codes', async () => {
    await api('POST', '/api/admin/discount/generate', adminDiscountBody);
    const { data } = await api('GET', '/api/admin/analytics');
    expect(data.totalDiscountCodes).toBe(1);
  });
});
