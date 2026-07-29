import { v4 as uuidv4 } from 'uuid';
import { DISCOUNT_CONFIG } from './constants.js';

/**
 * Generate a unique identifier (UUID v4)
 * @returns {string} UUID string
 */
export function generateId() {
  return uuidv4();
}

/**
 * Generate a random discount code (alphanumeric, 8 characters)
 * @returns {string} Random discount code
 */
export function generateDiscountCode() {
  const { CODE_LENGTH, ALPHANUMERIC } = DISCOUNT_CONFIG;
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHANUMERIC.charAt(Math.floor(Math.random() * ALPHANUMERIC.length));
  }
  return code;
}

/**
 * Calculate discount amount based on subtotal and percentage
 * @param {number} subtotal - Subtotal before discounts
 * @param {number} percentage - Discount percentage (0-100)
 * @returns {number} Discount amount
 */
export function calculateDiscount(subtotal, percentage) {
  return subtotal * (percentage / 100);
}

/**
 * Calculate final total after discount
 * @param {number} subtotal - Subtotal before discounts
 * @param {number} discountAmount - Discount amount
 * @returns {number} Final amount (minimum 0)
 */
export function calculateTotal(subtotal, discountAmount) {
  return Math.max(0, subtotal - discountAmount);
}

/**
 * Validate and parse order count to check if it's an nth order
 * @param {number} count - Global order counter
 * @param {number} nthOrder - Nth order threshold
 * @returns {boolean} True if current order is an nth order
 */
export function isNthOrder(count, nthOrder) {
  return count % nthOrder === 0 && count > 0; // Skip order 0 — counter starts at 1
}

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, decimals = 2) {
  return amount.toFixed(decimals);
}

/**
 * Calculate subtotal from items array
 * @param {Array} items - Array of items with price and quantity
 * @returns {number} Subtotal
 */
export function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}