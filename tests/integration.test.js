import { describe, it, expect, beforeEach } from 'vitest';
import { addToCart, clearCart, getCart, getCartTotal } from '../src/cart/index.js';
import { createOrder, getOrder, getAllOrders, resetOrderStorage } from '../src/order/index.js';
import { generateDiscountCode, validateDiscountCode, getAllDiscounts, resetNthOrderTracking, resetDiscountStorage } from '../src/discount/index.js';
import { generateAdminDiscountCode, getAdminAnalytics } from '../src/admin/index.js';

const userA = 'user-a';
const userB = 'user-b';
const cartA = 'cart-a';
const cartB = 'cart-b';
const itemX = { productId: 'x1', productName: 'Item X', price: 50, quantity: 1 };
const itemY = { productId: 'y1', productName: 'Item Y', price: 30, quantity: 2 };

function cleanCarts() {
  try { clearCart(cartA); } catch {}
  try { clearCart(cartB); } catch {}
}

beforeEach(() => {
  cleanCarts();
  resetOrderStorage();
  resetNthOrderTracking();
  resetDiscountStorage();
});

describe('Full checkout flow', () => {
  it('completes cart → checkout → order lifecycle', () => {
    addToCart(cartA, userA, itemX);
    addToCart(cartA, userA, itemY);
    const total = getCartTotal(cartA);
    expect(total.subtotal).toBe(110);
    expect(total.itemCount).toBe(2);
    const order = createOrder({ cartId: cartA, userId: userA });
    expect(order.finalAmount).toBe(110);
    expect(order.status).toBe('completed');
  });

  it('applies discount code during checkout', () => {
    addToCart(cartA, userA, itemX);
    const d = generateDiscountCode(20, 'manual', 1);
    const order = createOrder({ cartId: cartA, userId: userA, discountCode: d.code });
    expect(order.discountAmount).toBe(10);
    expect(order.finalAmount).toBe(40);
  });

  it('rejects invalid discount code', () => {
    addToCart(cartA, userA, itemX);
    expect(() => createOrder({ cartId: cartA, userId: userA, discountCode: 'FAKE' })).toThrow('Invalid discount code');
  });
});

describe('Nth order discount flow', () => {
  it('generates nth order discount on 5th order', () => {
    for (let i = 0; i < 4; i++) {
      addToCart('c' + i, 'u' + i, itemX);
      createOrder({ cartId: 'c' + i, userId: 'u' + i });
    }
    addToCart(cartA, userA, itemX);
    const order = createOrder({ cartId: cartA, userId: userA });
    expect(order.discountCode).toBeTruthy();
    expect(order.discountAmount).toBeGreaterThan(0);
  });
});

describe('Multi-user isolation', () => {
  it('keeps order history separate per user', () => {
    addToCart(cartA, userA, itemX);
    addToCart(cartB, userB, itemY);
    createOrder({ cartId: cartA, userId: userA });
    createOrder({ cartId: cartB, userId: userB });
    const allOrders = getAllOrders();
    expect(allOrders).toHaveLength(2);
  });
});

describe('Admin flows', () => {
  it('admin can generate and analytics reflect state', () => {
    addToCart(cartA, userA, itemX);
    createOrder({ cartId: cartA, userId: userA });
    const code = generateAdminDiscountCode({ percentage: 25, type: 'manual', maxUsage: 10 });
    expect(code.details.percentage).toBe(25);
    const analytics = getAdminAnalytics();
    expect(analytics.totalOrders).toBe(1);
    expect(analytics.totalDiscountCodes).toBe(1);
  });
});
