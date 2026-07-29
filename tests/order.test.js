import { describe, it, expect, beforeEach } from 'vitest';
import { createOrder, getOrder, getUserOrderHistory, getAllOrders, resetOrderStorage } from '../src/order/index.js';
import { generateDiscountCode } from '../src/discount/index.js';
import { addToCart, clearCart } from '../src/cart/index.js';
import { NotFoundError, BadRequestError } from '../src/shared/errors.js';

const testUserId = 'order-user';
const testCartId = 'order-cart';
const item = { productId: 'op1', productName: 'Item', price: 30, quantity: 2 };

function setupCart() {
  try { clearCart(testCartId); } catch {}
  return addToCart(testCartId, testUserId, item);
}

function cleanup() {
  try { clearCart(testCartId); } catch {}
  resetOrderStorage();
}

beforeEach(() => {
  cleanup();
});

describe('createOrder', () => {
  it('creates order from cart', () => {
    setupCart();
    const order = createOrder({ cartId: testCartId, userId: testUserId });
    expect(order).toBeDefined();
    expect(order.userId).toBe(testUserId);
    expect(order.subtotal).toBe(60);
    expect(order.finalAmount).toBe(60);
    expect(order.discountAmount).toBe(0);
    expect(order.items).toHaveLength(1);
  });

  it('throws BadRequestError for missing cartId or userId', () => {
    expect(() => createOrder({})).toThrow(BadRequestError);
  });

  it('throws BadRequestError for empty cart', () => {
    addToCart(testCartId, testUserId, item);
    clearCart(testCartId);
    expect(() => createOrder({ cartId: testCartId, userId: testUserId })).toThrow(BadRequestError);
  });

  it('applies manual discount code', () => {
    setupCart();
    const d = generateDiscountCode(10, 'manual', 5);
    const order = createOrder({ cartId: testCartId, userId: testUserId, discountCode: d.code });
    expect(order.discountAmount).toBe(6);
    expect(order.finalAmount).toBe(54);
    expect(order.discountCode).toBe(d.code);
  });

  it('throws NotFoundError for invalid discount code', () => {
    setupCart();
    expect(() => createOrder({ cartId: testCartId, userId: testUserId, discountCode: 'INVALID' })).toThrow(NotFoundError);
  });
});

describe('getOrder', () => {
  it('returns order by id', () => {
    setupCart();
    const order = createOrder({ cartId: testCartId, userId: testUserId });
    const found = getOrder(order.id);
    expect(found.id).toBe(order.id);
  });

  it('throws NotFoundError for missing order', () => {
    expect(() => getOrder('nonexistent')).toThrow(NotFoundError);
  });
});

describe('getAllOrders', () => {
  it('returns all orders', () => {
    setupCart();
    const o1 = createOrder({ cartId: testCartId, userId: testUserId });
    expect(getAllOrders()).toHaveLength(1);
  });
});

describe('getUserOrderHistory', () => {
  it('returns orders for specific user', () => {
    setupCart();
    const order = createOrder({ cartId: testCartId, userId: testUserId });
    const history = getUserOrderHistory(testUserId);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(order.id);
  });

  it('returns empty array for user with no orders', () => {
    expect(getUserOrderHistory('unknown-user')).toEqual([]);
  });
});

describe('resetOrderStorage', () => {
  it('clears all orders and counters', () => {
    setupCart();
    createOrder({ cartId: testCartId, userId: testUserId });
    const result = resetOrderStorage();
    expect(result.ordersCleared).toBe(1);
    expect(getAllOrders()).toHaveLength(0);
  });
});
