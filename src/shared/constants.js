/**
 * Shared constants for the e-commerce backend
 */

/**
 * Runtime config — populated by src/index.js from wrangler.toml [vars] env
 * @constant {Object}
 */
export const runtimeConfig = {
  nthOrder: 5,
  discountPercentage: 10
};

/**
 * Environment variable names
 * @constant {Object}
 */
export const ENV_VARS = {
  NTH_ORDER: 'NTH_ORDER',
  DISCOUNT_PERCENTAGE: 'DISCOUNT_PERCENTAGE',
  API_VERSION: 'API_VERSION'
};

/**
 * Error messages
 * @constant {Object}
 */
export const ERROR_MESSAGES = {
  CART_NOT_FOUND: 'Cart not found',
  CART_EMPTY: 'Cart is empty',
  INVALID_PRODUCT: 'Invalid product data',
  DISCOUNT_CODE_NOT_FOUND: 'Invalid discount code',
  DISCOUNT_CODE_EXHAUSTED: 'Discount code already used maximum times',
  NTH_ORDER_DISCOUNT_APPLIED: 'Nth order discount already applied',
  ORDER_NOT_FOUND: 'Order not found',
  BAD_REQUEST: 'Bad request',
  CONFLICT: 'Conflict'
};

/**
 * Discount code configurations
 * @constant {Object}
 */
export const DISCOUNT_CONFIG = {
  CODE_LENGTH: 8,
  ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
};