import worker from '../src/index.js';
import { resetCartStorage } from '../src/cart/index.js';
import { resetOrderStorage } from '../src/order/index.js';
import { resetDiscountStorage } from '../src/discount/index.js';
import { runtimeConfig } from '../src/shared/constants.js';

export const baseEnv = {
  NTH_ORDER: '5',
  DISCOUNT_PERCENTAGE: '10',
  API_VERSION: 'v1'
};

export async function api(method, path, body = undefined, env = baseEnv) {
  const init = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const req = new Request(`http://localhost${path}`, init);
  const res = await worker.fetch(req, env);
  const data = await res.json();
  return { status: res.status, data };
}

export function resetAll() {
  resetCartStorage();
  resetOrderStorage();
  resetDiscountStorage();
  runtimeConfig.nthOrder = 5;
  runtimeConfig.discountPercentage = 10;
}
