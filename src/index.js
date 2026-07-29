import { NotFoundError, BadRequestError } from './shared/errors.js';
import { getCart, addToCart, removeFromCart, clearCart, updateItemQuantity } from './cart/index.js';
import { createOrder, getOrder, getUserOrderHistory, getAllOrders } from './order/index.js';
import { validateDiscountCode } from './discount/index.js';
import { generateAdminDiscountCode, getAdminAnalytics, getAdminStorage } from './admin/index.js';
import { runtimeConfig } from './shared/constants.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...corsHeaders(),
      ...extraHeaders
    }
  });
}

function errorResponse(error) {
  if (error instanceof NotFoundError || error instanceof BadRequestError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  return jsonResponse({ error: error?.message || 'Internal server error' }, error?.status || 500);
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError('Invalid JSON body');
  }
}

function stripTrailingSlash(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname; // Normalize so /api/cart/ and /api/cart match same route
}

function createHealthResponse(apiVersion = 'v1') {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiVersion
  });
}

function matchPath(pathname, pattern) {
  return stripTrailingSlash(pathname) === pattern;
}

function matchPrefix(pathname, prefix) {
  const normalized = stripTrailingSlash(pathname);
  return normalized.startsWith(prefix);
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const pathname = stripTrailingSlash(url.pathname);
  const method = request.method.toUpperCase();
  const rawNthOrder = Number(env?.NTH_ORDER);
  const rawDiscountPercentage = Number(env?.DISCOUNT_PERCENTAGE);
  if (Number.isFinite(rawNthOrder) && rawNthOrder > 0) {
    runtimeConfig.nthOrder = rawNthOrder; // Override defaults from wrangler.toml [vars]
  }
  if (Number.isFinite(rawDiscountPercentage) && rawDiscountPercentage >= 0 && rawDiscountPercentage <= 100) {
    runtimeConfig.discountPercentage = rawDiscountPercentage;
  }
  const nthOrderConfig = {
    nthOrder: runtimeConfig.nthOrder,
    discountPercentage: runtimeConfig.discountPercentage
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    if (pathname === '/health') {
      return createHealthResponse(env.API_VERSION || 'v1');
    }

    if (method === 'GET' && matchPath(pathname, '/api/admin/analytics')) {
      return jsonResponse(getAdminAnalytics());
    }

    if (method === 'GET' && matchPath(pathname, '/api/admin/stats')) {
      return jsonResponse(getAdminStorage());
    }

    if (method === 'POST' && matchPath(pathname, '/api/admin/discount/generate')) {
      const body = await readJsonBody(request);
      const { percentage, type = 'manual', maxUsage = null, expiresAt = null } = body;

      if (percentage === undefined || percentage === null) {
        throw new BadRequestError('Percentage is required');
      }

      const normalizedExpiresAt = expiresAt ? new Date(expiresAt) : null;
      if (normalizedExpiresAt && Number.isNaN(normalizedExpiresAt.getTime())) {
        throw new BadRequestError('Expiration date must be valid');
      }

      const result = generateAdminDiscountCode({
        percentage,
        type,
        maxUsage,
        expiresAt: normalizedExpiresAt
      });

      return jsonResponse(result);
    }

    if (method === 'GET' && matchPath(pathname, '/api/orders')) {
      return jsonResponse(getAllOrders());
    }

    if (method === 'GET' && matchPrefix(pathname, '/api/orders/user/')) {
      const userId = decodeURIComponent(pathname.slice('/api/orders/user/'.length));
      return jsonResponse(getUserOrderHistory(userId));
    }

    if (method === 'GET' && matchPrefix(pathname, '/api/orders/')) {
      const orderId = decodeURIComponent(pathname.slice('/api/orders/'.length));
      return jsonResponse(getOrder(orderId));
    }

    if (method === 'GET' && matchPrefix(pathname, '/api/cart/')) {
      const cartId = decodeURIComponent(pathname.slice('/api/cart/'.length));
      if (!cartId || cartId.includes('/')) {
        throw new NotFoundError('Endpoint not found');
      }

      try {
        return jsonResponse(getCart(cartId));
      } catch (error) {
        if (error instanceof NotFoundError) {
          return jsonResponse({ // Return empty shell instead of 404 so client can init from it
            id: cartId,
            userId: null,
            items: [],
            createdAt: null,
            updatedAt: null
          });
        }
        throw error;
      }
    }

    if (method === 'POST' && matchPrefix(pathname, '/api/cart/') && pathname.endsWith('/items')) {
      const cartId = decodeURIComponent(pathname.slice('/api/cart/'.length, -'/items'.length));
      if (!cartId) {
        throw new NotFoundError('Endpoint not found');
      }

      const { userId, product } = await readJsonBody(request);
      return jsonResponse(addToCart(cartId, userId, product));
    }

    if (method === 'DELETE' && matchPrefix(pathname, '/api/cart/') && pathname.includes('/items/')) {
      const base = '/api/cart/';
      const itemsIndex = pathname.indexOf('/items/');
      const cartId = decodeURIComponent(pathname.slice(base.length, itemsIndex));
      const productId = decodeURIComponent(pathname.slice(itemsIndex + '/items/'.length));

      if (!cartId || !productId) {
        throw new NotFoundError('Endpoint not found');
      }

      return jsonResponse(removeFromCart(cartId, productId));
    }

    if (method === 'PATCH' && matchPrefix(pathname, '/api/cart/') && pathname.includes('/items/')) {
      const base = '/api/cart/';
      const itemsIndex = pathname.indexOf('/items/');
      const cartId = decodeURIComponent(pathname.slice(base.length, itemsIndex));
      const productId = decodeURIComponent(pathname.slice(itemsIndex + '/items/'.length));

      if (!cartId || !productId) {
        throw new NotFoundError('Endpoint not found');
      }

      const { quantity } = await readJsonBody(request);
      return jsonResponse(updateItemQuantity(cartId, productId, quantity));
    }

    if (method === 'DELETE' && matchPrefix(pathname, '/api/cart/')) {
      const cartId = decodeURIComponent(pathname.slice('/api/cart/'.length));
      if (!cartId || cartId.includes('/')) {
        throw new NotFoundError('Endpoint not found');
      }

      return jsonResponse(clearCart(cartId));
    }

    if (method === 'POST' && matchPrefix(pathname, '/api/checkout/')) {
      const cartId = decodeURIComponent(pathname.slice('/api/checkout/'.length));
      if (!cartId) {
        throw new BadRequestError('Cart ID is required');
      }

      const { userId, discountCode } = await readJsonBody(request);
      const order = createOrder({ cartId, userId, discountCode }, nthOrderConfig);

      return jsonResponse({
        order,
        message: 'Order placed successfully',
        discountCode: order.discountCode
      });
    }

    if (method === 'POST' && matchPath(pathname, '/api/discount/apply')) {
      const { cartId, discountCode } = await readJsonBody(request);

      if (!cartId || !discountCode) {
        throw new BadRequestError('Cart ID and discount code are required');
      }

      const cart = getCart(cartId);
      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = validateDiscountCode(discountCode);
      const discountAmount = (subtotal * discount.percentage) / 100;
      const finalTotal = Math.max(0, subtotal - discountAmount);

      return jsonResponse({
        discountCode,
        discountPercentage: discount.percentage,
        discountAmount,
        finalTotal,
        formattedDiscountAmount: finalTotal.toFixed(2)
      });
    }

    return jsonResponse({ error: 'Endpoint not found' }, 404);
  } catch (error) {
    return errorResponse(error);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route API/health to handler, everything else to static assets
    if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request); // Serve frontend SPA from ./frontend/dist
    }

    return jsonResponse({ error: 'Endpoint not found' }, 404);
  }
};
