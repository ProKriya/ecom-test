import { describe, it, expect, beforeEach } from 'vitest';
import { getCart, addToCart, removeFromCart, clearCart, getCartTotal, createCart, resetCartStorage } from '../src/cart/index.js';
import { NotFoundError } from '../src/shared/errors.js';

const testUser = 'user-1';
const testCartId = 'cart-1';
const productA = { productId: 'p1', productName: 'Widget', price: 10, quantity: 2 };
const productB = { productId: 'p2', productName: 'Gadget', price: 25, quantity: 1 };

beforeEach(() => {
  resetCartStorage();
});

describe('createCart', () => {
  it('creates a cart with given userId', () => {
    const cart = createCart(testUser);
    expect(cart.userId).toBe(testUser);
    expect(cart.items).toEqual([]);
    expect(cart.id).toBeTruthy();
  });
});

describe('getCart', () => {
  it('throws NotFoundError for non-existent cart', () => {
    expect(() => getCart('nonexistent')).toThrow(NotFoundError);
  });
});

describe('addToCart', () => {
  it('creates cart and adds item', () => {
    const cart = addToCart(testCartId, testUser, productA);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p1');
  });

  it('increments quantity for existing product', () => {
    addToCart(testCartId, testUser, productA);
    const cart = addToCart(testCartId, testUser, { ...productA, quantity: 3 });
    expect(cart.items[0].quantity).toBe(5);
  });

  it('throws on invalid product data', () => {
    expect(() => addToCart(testCartId, testUser, {})).toThrow('Invalid product data');
  });

  it('allows price of 0', () => {
    const free = { productId: 'p3', productName: 'Freebie', price: 0, quantity: 1 };
    const cart = addToCart(testCartId, testUser, free);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].price).toBe(0);
  });
});

describe('removeFromCart', () => {
  it('removes item from cart', () => {
    addToCart(testCartId, testUser, productA);
    addToCart(testCartId, testUser, productB);
    const cart = removeFromCart(testCartId, 'p1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p2');
  });

  it('throws NotFoundError when cart missing', () => {
    expect(() => removeFromCart('nonexistent', 'p1')).toThrow(NotFoundError);
  });
});

describe('getCartTotal', () => {
  it('calculates correct totals', () => {
    addToCart(testCartId, testUser, productA);
    addToCart(testCartId, testUser, productB);
    const total = getCartTotal(testCartId);
    expect(total.subtotal).toBe(45);
    expect(total.itemCount).toBe(2);
  });
});