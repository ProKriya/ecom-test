import { generateId, formatCurrency } from '../shared/utils.js';
import { NotFoundError } from '../shared/errors.js';

/**
 * In-memory storage for carts and user-cart mapping
 * In a real Cloudflare Worker, these would be stored in KV or D1
 */
const carts = new Map(); // { cartId: Cart }
const usersCarts = new Map(); // { userId: cartId }

/**
 * Get a cart by ID
 * @param {string} cartId - Cart identifier
 * @returns {Cart} Cart object
 * @throws {NotFoundError} If cart doesn't exist
 */
export function getCart(cartId) {
  if (!carts.has(cartId)) {
    throw new NotFoundError('Cart not found');
  }
  return carts.get(cartId);
}

/**
 * Add item to cart (or increment quantity if item exists)
 * @param {string} cartId - Cart identifier
 * @param {string} userId - User identifier
 * @param {CartItem} product - Product to add
 * @returns {Cart} Updated cart
 */
export function addToCart(cartId, userId, product) {
  // Validate product data
  if (!product || !product.productId || !product.productName || (product.price === undefined || product.price === null || product.price < 0) || !product.quantity) {
    throw new Error('Invalid product data');
  }

  // Validate quantity
  if (product.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  let cart = carts.get(cartId);

  if (!cart) {
    // Create new cart
    cart = {
      id: cartId,
      userId: userId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    carts.set(cartId, cart);
    usersCarts.set(userId, cartId);
  } else {
    // Update timestamp
    cart.updatedAt = new Date();
  }

  // Add item (or increment quantity if product already exists)
  const existingItemIndex = cart.items.findIndex(item => item.productId === product.productId);
  if (existingItemIndex >= 0) {
    // Update existing item
    cart.items[existingItemIndex].quantity += product.quantity;
  } else {
    // Add new item
    cart.items.push({
      productId: product.productId,
      productName: product.productName,
      price: product.price,
      quantity: product.quantity
    });
  }

  return cart;
}

/**
 * Remove item from cart
 * @param {string} cartId - Cart identifier
 * @param {string} productId - Product identifier to remove
 * @returns {Cart} Updated cart (may be empty)
 * @throws {NotFoundError} If cart doesn't exist
 */
export function removeFromCart(cartId, productId) {
  const cart = getCart(cartId);

  cart.items = cart.items.filter(item => item.productId !== productId);
  cart.updatedAt = new Date();

  // If cart is now empty, clean up
  if (cart.items.length === 0) {
    const userId = cart.userId;
    carts.delete(cartId);
    usersCarts.delete(userId);
  }

  return cart;
}

/**
 * Clear entire cart
 * @param {string} cartId - Cart identifier
 * @returns {Object} Confirmation message
 * @throws {NotFoundError} If cart doesn't exist
 */
export function clearCart(cartId) {
  const cart = getCart(cartId);
  cart.items = [];
  cart.updatedAt = new Date();

  return {
    message: 'Cart cleared successfully',
    cartId: cartId
  };
}

/**
 * Get cart total (subtotal, items count)
 * @param {string} cartId - Cart identifier
 * @returns {Object} Cart summary with total and items
 * @throws {NotFoundError} If cart doesn't exist
 */
export function getCartTotal(cartId) {
  const cart = getCart(cartId);
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  return {
    cartId: cart.id,
    subtotal: subtotal,
    itemCount: cart.items.length,
    formattedSubtotal: formatCurrency(subtotal),
    items: cart.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      formattedTotal: formatCurrency(item.price * item.quantity)
    }))
  };
}

/**
 * Create a new cart for a user
 * @param {string} userId - User identifier
 * @returns {Cart} New cart
 */
export function createCart(userId) {
  const cartId = generateId();
  const cart = {
    id: cartId,
    userId: userId,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  carts.set(cartId, cart);
  usersCarts.set(userId, cartId);
  return cart;
}

/**
 * Get cart by user ID
 * @param {string} userId - User identifier
 * @returns {Cart} Cart for the user (may be null if doesn't exist)
 */
export function getCartByUser(userId) {
  const cartId = usersCarts.get(userId);
  if (!cartId) {
    return null;
  }
  return getCart(cartId);
}

/**
 * Update cart item quantity
 * @param {string} cartId - Cart identifier
 * @param {string} productId - Product identifier
 * @param {number} quantity - New quantity
 * @returns {Cart} Updated cart
 * @throws {NotFoundError} If cart or product doesn't exist in cart
 */
export function updateItemQuantity(cartId, productId, quantity) {
  const cart = getCart(cartId);

  const itemIndex = cart.items.findIndex(item => item.productId === productId);
  if (itemIndex < 0) {
    throw new Error('Product not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity <= 0
    cart.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
  }

  cart.updatedAt = new Date();

  // If cart is now empty, clean up
  if (cart.items.length === 0) {
    const userId = cart.userId;
    carts.delete(cartId);
    usersCarts.delete(userId);
  }

  return cart;
}

/**
 * Export all carts (for testing/debugging)
 * @returns {Array<Cart>} All carts
 */
export function getAllCarts() {
  return Array.from(carts.values());
}

/**
 * Export cart storage (for testing/debugging)
 * @returns {Object} Cart storage
 */
export function getCartStorage() {
  return {
    carts: Array.from(carts.entries()),
    usersCarts: Array.from(usersCarts.entries())
  };
}

export function resetCartStorage() {
  carts.clear();
  usersCarts.clear();
  return { message: 'Cart storage reset' };
}
