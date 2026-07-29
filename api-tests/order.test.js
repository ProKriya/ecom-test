import { describe, it, expect, beforeEach } from 'vitest';
import { api, resetAll } from './helpers.js';
import { product } from './payloads.js';

beforeEach(resetAll);

describe('Order API', () => {
  const cartId = 'order-cart';
  const userId = 'order-user';

  async function setupCart() {
    await api('POST', `/api/cart/${cartId}/items`, { userId, product });
  }

  it('POST /api/checkout/:cartId creates order', async () => {
    await setupCart();
    const { status, data } = await api('POST', `/api/checkout/${cartId}`, { userId });
    expect(status).toBe(200);
    expect(data.order.status).toBe('completed');
    expect(data.order.subtotal).toBe(50);
    expect(data.order.finalAmount).toBe(50);
    expect(data.order.userId).toBe(userId);
  });

  it('POST /api/checkout/:cartId clears cart after order', async () => {
    await setupCart();
    await api('POST', `/api/checkout/${cartId}`, { userId });
    const { data: cart } = await api('GET', `/api/cart/${cartId}`);
    expect(cart.items).toHaveLength(0);
  });

  it('GET /api/orders/:orderId returns order', async () => {
    await setupCart();
    const { data: orderRes } = await api('POST', `/api/checkout/${cartId}`, { userId });
    const orderId = orderRes.order.id;
    const { status, data } = await api('GET', `/api/orders/${orderId}`);
    expect(status).toBe(200);
    expect(data.id).toBe(orderId);
  });

  it('GET /api/orders/user/:userId returns user orders', async () => {
    await setupCart();
    await api('POST', `/api/checkout/${cartId}`, { userId });
    const { status, data } = await api('GET', `/api/orders/user/${userId}`);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
  });

  it('GET /api/orders returns all orders', async () => {
    await setupCart();
    await api('POST', `/api/checkout/${cartId}`, { userId });
    const { status, data } = await api('GET', '/api/orders');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
  });

  it('POST /api/checkout/:cartId rejects empty cart', async () => {
    await api('POST', `/api/cart/${cartId}/items`, { userId, product });
    await api('DELETE', `/api/cart/${cartId}`);
    const { status } = await api('POST', `/api/checkout/${cartId}`, { userId });
    expect(status).toBe(400);
  });

  it('POST /api/checkout/:cartId rejects non-existent cart', async () => {
    const { status } = await api('POST', '/api/checkout/no-such-cart', { userId, cartId: 'no-such-cart' });
    expect(status).toBe(404);
  });

  it('Nth order discount applied on 5th order', async () => {
    for (let i = 0; i < 4; i++) {
      const cid = `nth-cart-${i}`;
      await api('POST', `/api/cart/${cid}/items`, { userId: `nth-user-${i}`, product });
      await api('POST', `/api/checkout/${cid}`, { userId: `nth-user-${i}` });
    }
    await setupCart();
    const { data } = await api('POST', `/api/checkout/${cartId}`, { userId });
    expect(data.order.discountAmount).toBeGreaterThan(0);
    expect(data.order.discountCode).toBeTruthy();
  });
});
