import { describe, it, expect, beforeEach } from 'vitest';
import { generateAdminDiscountCode, getAdminAnalytics } from '../src/admin/index.js';
import { resetOrderStorage, createOrder } from '../src/order/index.js';
import { addToCart, clearCart } from '../src/cart/index.js';
import { resetDiscountStorage } from '../src/discount/index.js';

const testUserId = 'admin-tu';
const testCartId = 'admin-tc';
const item = { productId: 'ap1', productName: 'A', price: 20, quantity: 3 };

function setup() {
  try { clearCart(testCartId); } catch {}
  resetOrderStorage();
  resetDiscountStorage();
  addToCart(testCartId, testUserId, item);
}

beforeEach(setup);

describe('generateAdminDiscountCode', () => {
  it('generates code with percentage', () => {
    const r = generateAdminDiscountCode({ percentage: 15 });
    expect(r.message).toContain('successfully');
    expect(r.code).toBeTruthy();
    expect(r.details.percentage).toBe(15);
  });

  it('throws for missing percentage', () => {
    expect(() => generateAdminDiscountCode({})).toThrow('Percentage is required');
  });

  it('throws for invalid percentage', () => {
    expect(() => generateAdminDiscountCode({ percentage: 101 })).toThrow('must be between 0 and 100');
  });

  it('throws for invalid type', () => {
    expect(() => generateAdminDiscountCode({ percentage: 10, type: 'bad' })).toThrow('Invalid discount type');
  });

  it('throws for maxUsage <= 0', () => {
    expect(() => generateAdminDiscountCode({ percentage: 10, maxUsage: 0 })).toThrow('Max usage must be greater than 0');
  });
});

describe('getAdminAnalytics', () => {
  it('returns analytics with zero state', () => {
    const a = getAdminAnalytics();
    expect(a.totalOrders).toBe(0);
    expect(a.totalItems).toBe(0);
    expect(a.totalRevenue).toBe(0);
  });

  it('returns analytics after orders', () => {
    createOrder({ cartId: testCartId, userId: testUserId });
    const a = getAdminAnalytics();
    expect(a.totalOrders).toBe(1);
    expect(a.totalItems).toBe(3);
    expect(a.totalRevenue).toBe(60);
    expect(a.totalDiscountCodes).toBe(0);
  });
});
