export const product = { productId: 'p1', productName: 'Test Product', price: 25, quantity: 2 };

export const product2 = { productId: 'p2', productName: 'Another Item', price: 50, quantity: 1 };

export const addItemBody = {
  userId: 'test-user',
  product
};

export const addItem2Body = {
  userId: 'test-user',
  product: product2
};

export const checkoutBody = {
  userId: 'test-user'
};

export const checkoutWithCodeBody = {
  userId: 'test-user',
  discountCode: 'TEST10'
};

export const adminDiscountBody = {
  percentage: 15,
  type: 'manual',
  maxUsage: 5
};

export const adminDiscountNthBody = {
  percentage: 10,
  type: 'nth_order',
  maxUsage: 1
};

export const applyDiscountBody = {
  cartId: 'test-cart',
  discountCode: 'TEST10'
};
