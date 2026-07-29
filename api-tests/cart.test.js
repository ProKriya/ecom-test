import { describe, it, expect, beforeEach } from 'vitest';
import { api, resetAll } from './helpers.js';
import { addItemBody, addItem2Body } from './payloads.js';

beforeEach(resetAll);

describe('Cart API', () => {
  const cartId = 'test-cart';
  const productId = 'p1';

  it('GET /api/cart/:cartId returns empty cart for new cart', async () => {
    const { status, data } = await api('GET', `/api/cart/${cartId}`);
    expect(status).toBe(200);
    expect(data.id).toBe(cartId);
    expect(data.items).toEqual([]);
    expect(data.userId).toBeNull();
  });

  it('POST /api/cart/:cartId/items adds item to cart', async () => {
    const { status, data } = await api('POST', `/api/cart/${cartId}/items`, addItemBody);
    expect(status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].productId).toBe(productId);
    expect(data.items[0].quantity).toBe(2);
  });

  it('POST /api/cart/:cartId/items increments quantity for duplicate product', async () => {
    await api('POST', `/api/cart/${cartId}/items`, addItemBody);
    const { status, data } = await api('POST', `/api/cart/${cartId}/items`, addItemBody);
    expect(status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].quantity).toBe(4);
  });

  it('POST /api/cart/:cartId/items handles multiple products', async () => {
    await api('POST', `/api/cart/${cartId}/items`, addItemBody);
    const { status, data } = await api('POST', `/api/cart/${cartId}/items`, addItem2Body);
    expect(status).toBe(200);
    expect(data.items).toHaveLength(2);
  });

  it('DELETE /api/cart/:cartId/items/:productId removes item', async () => {
    await api('POST', `/api/cart/${cartId}/items`, addItemBody);
    const { status, data } = await api('DELETE', `/api/cart/${cartId}/items/${productId}`);
    expect(status).toBe(200);
    const { data: cart } = await api('GET', `/api/cart/${cartId}`);
    expect(cart.items).toHaveLength(0);
  });

  it('PATCH /api/cart/:cartId/items/:productId updates quantity', async () => {
    await api('POST', `/api/cart/${cartId}/items`, addItemBody);
    const { status, data } = await api('PATCH', `/api/cart/${cartId}/items/${productId}`, { quantity: 5 });
    expect(status).toBe(200);
    expect(data.items[0].quantity).toBe(5);
  });

  it('DELETE /api/cart/:cartId clears cart', async () => {
    await api('POST', `/api/cart/${cartId}/items`, addItemBody);
    const { status } = await api('DELETE', `/api/cart/${cartId}`);
    expect(status).toBe(200);
    const { data: cart } = await api('GET', `/api/cart/${cartId}`);
    expect(cart.items).toHaveLength(0);
  });

  it('POST /api/cart/:cartId/items rejects invalid product', async () => {
    const { status } = await api('POST', `/api/cart/${cartId}/items`, { userId: 'u', product: {} });
    expect(status).toBe(500);
  });

  it('returns empty cart for unknown cart GET', async () => {
    const { status, data } = await api('GET', '/api/cart/nonexistent');
    expect(status).toBe(200);
    expect(data.items).toEqual([]);
    expect(data.userId).toBeNull();
  });

  it('DELETE /api/cart/:cartId/items/:productId returns 404 for missing item', async () => {
    const { status } = await api('DELETE', `/api/cart/${cartId}/items/nonexistent`);
    expect(status).toBe(404);
  });
});
