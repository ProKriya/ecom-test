import { generateId, calculateDiscount, calculateTotal, isNthOrder, calculateSubtotal, generateDiscountCode } from '../shared/utils.js';
import { NotFoundError, BadRequestError } from '../shared/errors.js';
import { getCart, clearCart } from '../cart/index.js';
import { validateDiscountCode } from '../discount/index.js';
import { runtimeConfig } from '../shared/constants.js';

const orders = [];
let globalOrderCounter = 0;
const orderHistoryByUser = new Map();
export let nthOrderDiscounts = [];

function resolveNthOrderConfig(config = {}) {
  const nthOrder = Number(config.nthOrder);
  const discountPercentage = Number(config.discountPercentage);

  return {
    nthOrder: Number.isFinite(nthOrder) && nthOrder > 0 ? nthOrder : runtimeConfig.nthOrder,
    discountPercentage: Number.isFinite(discountPercentage) && discountPercentage >= 0 && discountPercentage <= 100
      ? discountPercentage
      : runtimeConfig.discountPercentage
  };
}

function applyNthOrderLogic(subtotal, config = {}) {
  const { nthOrder, discountPercentage } = resolveNthOrderConfig(config);
  globalOrderCounter++;

  if (isNthOrder(globalOrderCounter, nthOrder)) {
    const discount = {
      code: generateDiscountCode(),
      percentage: discountPercentage,
      type: 'nth_order',
      maxUsage: 1,
      expiresAt: null,
      createdAt: new Date()
    };

    nthOrderDiscounts.push(discount);

    const discountAmount = calculateDiscount(subtotal, discount.percentage);

    return {
      code: discount.code,
      percentage: discount.percentage,
      discountAmount: discountAmount
    };
  }

  return null;
}

export function createOrder(input, config = {}) {
  const { cartId, userId, discountCode = null } = input;

  if (!cartId || !userId) {
    throw new BadRequestError('Cart ID and User ID are required');
  }

  const cart = getCart(cartId);

  if (cart.userId !== userId) {
    throw new BadRequestError('Cart does not belong to this user');
  }

  if (cart.items.length === 0) {
    throw new BadRequestError('Cannot create order: Cart is empty');
  }

  const subtotal = calculateSubtotal(cart.items);

  let discountAmount = 0;
  let discountPercentage = 0;
  let appliedDiscountCode = null;

  if (discountCode) {
    const discount = validateDiscountCode(discountCode);
    discountPercentage = discount.percentage;
    discountAmount = calculateDiscount(subtotal, discountPercentage);
    appliedDiscountCode = discount.code;
  }

  const nthOrderDiscount = applyNthOrderLogic(subtotal, config);
  if (nthOrderDiscount) {
    discountAmount += nthOrderDiscount.discountAmount;
    discountPercentage = nthOrderDiscount.percentage;
    appliedDiscountCode = nthOrderDiscount.code;
  }

  const totalDiscount = discountAmount;
  if (totalDiscount > subtotal) {
    discountAmount = subtotal;
  }

  const finalAmount = calculateTotal(subtotal, discountAmount);

  const order = {
    id: generateId(),
    userId,
    items: [...cart.items],
    subtotal,
    discountAmount,
    finalAmount,
    discountCode: appliedDiscountCode,
    status: 'completed',
    createdAt: new Date()
  };

  orders.push(order);

  if (!orderHistoryByUser.has(userId)) {
    orderHistoryByUser.set(userId, []);
  }
  orderHistoryByUser.get(userId).push(order.id);

  clearCart(cartId);

  return order;
}

export function getOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  return order;
}

export function getUserOrderHistory(userId) {
  if (!orderHistoryByUser.has(userId)) {
    return [];
  }

  const orderIds = orderHistoryByUser.get(userId);
  return orderIds
    .map(id => orders.find(o => o.id === id))
    .filter(Boolean);
}

export function getOrderStats() {
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
    totalDiscountsGiven: orders.reduce((sum, o) => sum + o.discountAmount, 0)
  };
}

export function getAllOrders() {
  return [...orders];
}

export function getOrderStorage() {
  return {
    orders: orders,
    globalOrderCounter: globalOrderCounter,
    orderHistoryByUser: Array.from(orderHistoryByUser.entries()),
    nthOrderDiscounts: nthOrderDiscounts
  };
}

export function resetOrderStorage() {
  const count = orders.length;
  orders.length = 0;
  globalOrderCounter = 0;
  orderHistoryByUser.clear();
  nthOrderDiscounts = [];
  return { message: 'Order storage reset', ordersCleared: count };
}
