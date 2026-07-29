import { generateDiscountCode, getAllDiscounts } from '../discount/index.js';
import { getAllOrders, nthOrderDiscounts } from '../order/index.js';

/**
 * Generate a discount code (Admin API)
 * @param {Object} input - Discount code generation input
 * @param {number} input.percentage - Discount percentage (0-100)
 * @param {'nth_order'|'manual'|'special'} [input.type='manual'] - Type of discount
 * @param {number|null} [input.maxUsage=null] - Maximum usage limit
 * @param {Date|null} [input.expiresAt=null] - Expiration date
 * @returns {Object} Generation result
 */
export function generateAdminDiscountCode(input) {
  const { percentage, type = 'manual', maxUsage = null, expiresAt = null } = input;

  // Validate percentage
  if (percentage === undefined || percentage === null) {
    throw new Error('Percentage is required');
  }

  if (percentage < 0 || percentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  // Validate type if provided
  if (type && !['nth_order', 'manual', 'special'].includes(type)) {
    throw new Error(`Invalid discount type. Must be one of: nth_order, manual, special`);
  }

  // Validate maxUsage if provided
  if (maxUsage !== null && maxUsage <= 0) {
    throw new Error('Max usage must be greater than 0');
  }

  // Validate expiresAt if provided
  if (expiresAt && expiresAt <= new Date()) {
    throw new Error('Expiration date must be in the future');
  }

  // Generate discount code
  const discount = generateDiscountCode(percentage, type, maxUsage, expiresAt);

  return {
    message: 'Discount code generated successfully',
    code: discount.code,
    details: discount
  };
}

/**
 * Get analytics (Admin API)
 * Returns comprehensive analytics about the store
 * @returns {Analytics} Store analytics
 */
export function getAdminAnalytics() {
  const allOrders = getAllOrders();

  let totalItems = 0;
  let totalRevenue = 0;
  let totalDiscountsGiven = 0;
  let nthOrderCount = 0;

  allOrders.forEach(order => {
    totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);
    totalRevenue += order.finalAmount;
    totalDiscountsGiven += order.discountAmount;

    // Cross-reference order's discountCode against nthOrderDiscounts array
    // to distinguish auto-generated codes from admin-generated ones
    if (order.discountCode) {
      const discount = nthOrderDiscounts.find(d => d.code === order.discountCode);
      if (discount && discount.type === 'nth_order') {
        nthOrderCount++;
      }
    }
  });

  // Get all discount codes
  const allDiscounts = getAllDiscounts();

  // Calculate active discount codes (not expired and not exhausted)
  const activeDiscountCodes = allDiscounts.filter(discount => {
    // Check expiration
    if (discount.expiresAt && discount.expiresAt <= new Date()) {
      return false;
    }

    // Check max usage
    if (discount.maxUsage !== null && discount.usageCount >= discount.maxUsage) {
      return false;
    }

    return true;
  });

  return {
    totalOrders: allOrders.length,
    totalItems,
    totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
    totalDiscountCodes: allDiscounts.length,
    totalDiscountsGiven: Math.round(totalDiscountsGiven * 100) / 100, // Round to 2 decimals
    nthOrderCount,
    activeDiscountCodes: activeDiscountCodes.length
  };
}

/**
 * Get nth order discount stats
 * @returns {Object} Nth order discount statistics
 */
export function getNthOrderStats() {
  const allDiscounts = getAllDiscounts();
  const nthOrderDiscounts = allDiscounts.filter(d => d.type === 'nth_order');

  return {
    nthOrderDiscountsCount: nthOrderDiscounts.length,
    totalCodesIssued: nthOrderDiscounts.length,
    codesUsed: nthOrderDiscounts.filter(d => d.usageCount > 0).length,
    activeCodes: nthOrderDiscounts.filter(d => d.maxUsage === null || d.usageCount < d.maxUsage).length
  };
}

/**
 * Get discount code statistics
 * @returns {Array<Object>} Statistics for each discount code
 */
export function getDiscountCodesStats() {
  return getAllDiscounts().map(discount => ({
    code: discount.code,
    percentage: discount.percentage,
    type: discount.type,
    usageCount: discount.usageCount,
    maxUsage: discount.maxUsage,
    isExpired: discount.expiresAt !== null && discount.expiresAt <= new Date(),
    isActive: discount.maxUsage === null || discount.usageCount < discount.maxUsage
  }));
}

/**
 * Export nth order discounts (for testing/debugging)
 * @returns {Array} Nth order discounts
 */
export function getNthOrderDiscounts() {
  return [...nthOrderDiscounts];
}

/**
 * Get admin storage (for testing/debugging)
 * @returns {Object} Admin storage information
 */
export function getAdminStorage() {
  return {
    nthOrderDiscounts: getNthOrderDiscounts(),
    allDiscounts: getAllDiscounts(),
    orders: getAllOrders()
  };
}

export { resetNthOrderTracking } from '../discount/index.js';
