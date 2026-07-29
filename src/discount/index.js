import { generateDiscountCode as generateCodeString } from '../shared/utils.js';
import { NotFoundError, ConflictError } from '../shared/errors.js';

/**
 * In-memory storage for discount codes and nth order tracking
 * In a real Cloudflare Worker, these would be stored in KV or D1
 */
const discountCodes = new Map(); // { code: DiscountCode }
const usedCodes = new Set(); // { code } for nth order tracking

/**
 * Generate a new discount code
 * @param {number} percentage - Discount percentage (0-100)
 * @param {'nth_order'|'manual'|'special'} type - Type of discount
 * @param {number|null} maxUsage - Maximum usage limit (null = unlimited)
 * @param {Date|null} expiresAt - Expiration date (null = never expires)
 * @returns {DiscountCode} Generated discount code
 */
export function generateDiscountCode(percentage, type = 'manual', maxUsage = null, expiresAt = null) {
  // Validate percentage
  if (percentage < 0 || percentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  // Validate type
  const validTypes = ['nth_order', 'manual', 'special'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid discount type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Validate maxUsage if provided
  if (maxUsage !== null && maxUsage <= 0) {
    throw new Error('Max usage must be greater than 0');
  }

  // Validate expiresAt if provided
  if (expiresAt && expiresAt <= new Date()) {
    throw new Error('Expiration date must be in the future');
  }

  const code = generateCodeString();
  const discount = {
    code,
    percentage,
    type,
    usageCount: 0,
    maxUsage,
    expiresAt,
    createdAt: new Date()
  };

  discountCodes.set(code, discount);

  return discount;
}

/**
 * Validate a discount code and check usage
 * @param {string} code - Discount code to validate
 * @returns {DiscountCode} Discount code with updated usage count
 * @throws {NotFoundError} If code doesn't exist
 * @throws {ConflictError} If code is exhausted or nth order already applied
 */
export function validateDiscountCode(code) {
  const discount = discountCodes.get(code);

  if (!discount) {
    throw new NotFoundError('Invalid discount code');
  }

  // Check if code has reached max usage
  if (discount.maxUsage !== null && discount.usageCount >= discount.maxUsage) {
    throw new ConflictError('Discount code already used maximum times');
  }

  // Check expiration
  if (discount.expiresAt && discount.expiresAt <= new Date()) {
    throw new NotFoundError('Discount code has expired');
  }

  // Check for nth order duplicate
  if (discount.type === 'nth_order') {
    if (usedCodes.has(code)) {
      throw new ConflictError('Nth order discount already applied');
    }
    usedCodes.add(code);
  }

  // Increment usage count
  discount.usageCount++;

  return discount;
}

/**
 * Get discount code details
 * @param {string} code - Discount code to retrieve
 * @returns {DiscountCode} Discount code details
 * @throws {NotFoundError} If code doesn't exist
 */
export function getDiscountDetails(code) {
  const discount = discountCodes.get(code);
  if (!discount) {
    throw new NotFoundError('Discount code not found');
  }

  return discount;
}

/**
 * Get all discount codes
 * @returns {Array<DiscountCode>} All discount codes
 */
export function getAllDiscounts() {
  return Array.from(discountCodes.values());
}

/**
 * Get nth order discount statistics
 * @returns {Object} Nth order discount stats
 */
export function getNthOrderStats() {
  const nthOrders = Array.from(discountCodes.values()).filter(d => d.type === 'nth_order');

  return {
    nthOrderCount: nthOrders.length,
    totalCodesIssued: nthOrders.length,
    activeCodes: nthOrders.length - usedCodes.size
  };
}

/**
 * Get discount code usage statistics
 * @param {string} code - Discount code
 * @returns {Object} Usage statistics
 * @throws {NotFoundError} If code doesn't exist
 */
export function getDiscountUsage(code) {
  const discount = discountCodes.get(code);
  if (!discount) {
    throw new NotFoundError('Discount code not found');
  }

  return {
    code: discount.code,
    percentage: discount.percentage,
    type: discount.type,
    usageCount: discount.usageCount,
    maxUsage: discount.maxUsage,
    isActive: discount.maxUsage === null || discount.usageCount < discount.maxUsage,
    isExpired: discount.expiresAt !== null && discount.expiresAt <= new Date()
  };
}

/**
 * Export discount storage (for testing/debugging)
 * @returns {Object} Discount storage
 */
export function getDiscountStorage() {
  return {
    discountCodes: Array.from(discountCodes.entries()),
    usedCodes: Array.from(usedCodes)
  };
}

/**
 * Reset nth order tracking (for testing)
 * @returns {number} Number of nth order codes used
 */
export function resetNthOrderTracking() {
  const count = usedCodes.size;
  usedCodes.clear();
  return count;
}

export function resetDiscountStorage() {
  discountCodes.clear();
  usedCodes.clear();
  return { message: 'Discount storage reset' };
}
