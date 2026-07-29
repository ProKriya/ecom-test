import { describe, it, expect } from 'vitest';
import { generateId, generateDiscountCode, calculateDiscount, calculateTotal, isNthOrder, formatCurrency, calculateSubtotal } from '../src/shared/utils.js';
import { AppError, NotFoundError, BadRequestError, ConflictError, UnauthorizedError, InternalServerError } from '../src/shared/errors.js';

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('generateDiscountCode', () => {
  it('returns an 8-character alphanumeric string', () => {
    const code = generateDiscountCode();
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('returns unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateDiscountCode()));
    expect(codes.size).toBe(100);
  });
});

describe('calculateDiscount', () => {
  it('calculates 10% of 100 as 10', () => {
    expect(calculateDiscount(100, 10)).toBe(10);
  });

  it('calculates 50% of 200 as 100', () => {
    expect(calculateDiscount(200, 50)).toBe(100);
  });

  it('returns 0 for 0% discount', () => {
    expect(calculateDiscount(500, 0)).toBe(0);
  });

  it('calculates 100% discount as full subtotal', () => {
    expect(calculateDiscount(150, 100)).toBe(150);
  });
});

describe('calculateTotal', () => {
  it('subtracts discount from subtotal', () => {
    expect(calculateTotal(100, 20)).toBe(80);
  });

  it('returns 0 when discount exceeds subtotal', () => {
    expect(calculateTotal(100, 150)).toBe(0);
  });

  it('returns subtotal when discount is 0', () => {
    expect(calculateTotal(100, 0)).toBe(100);
  });
});

describe('isNthOrder', () => {
  it('returns true for 5th order with N=5', () => {
    expect(isNthOrder(5, 5)).toBe(true);
  });

  it('returns false for 1st order with N=5', () => {
    expect(isNthOrder(1, 5)).toBe(false);
  });

  it('returns false for 0th order', () => {
    expect(isNthOrder(0, 5)).toBe(false);
  });

  it('returns true for 10th order with N=5', () => {
    expect(isNthOrder(10, 5)).toBe(true);
  });

  it('returns false when count is not multiple of N', () => {
    expect(isNthOrder(3, 5)).toBe(false);
    expect(isNthOrder(7, 5)).toBe(false);
  });
});

describe('formatCurrency', () => {
  it('formats 10.5 as "10.50"', () => {
    expect(formatCurrency(10.5)).toBe('10.50');
  });

  it('formats 0 as "0.00"', () => {
    expect(formatCurrency(0)).toBe('0.00');
  });

  it('formats 1234.567 as "1234.57" with 2 decimals', () => {
    expect(formatCurrency(1234.567)).toBe('1234.57');
  });

  it('respects custom decimal places', () => {
    expect(formatCurrency(10.5, 3)).toBe('10.500');
  });
});

describe('calculateSubtotal', () => {
  it('calculates sum of price * quantity', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(35);
  });

  it('returns 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

describe('AppError', () => {
  it('creates error with message and default status 500', () => {
    const err = new AppError('test error');
    expect(err.message).toBe('test error');
    expect(err.status).toBe(500);
    expect(err.name).toBe('AppError');
  });

  it('creates error with custom status', () => {
    const err = new AppError('not found', 404);
    expect(err.status).toBe(404);
  });
});

describe('NotFoundError', () => {
  it('has status 404', () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.name).toBe('NotFoundError');
  });
});

describe('BadRequestError', () => {
  it('has status 400', () => {
    const err = new BadRequestError();
    expect(err.status).toBe(400);
  });
});

describe('ConflictError', () => {
  it('has status 409', () => {
    const err = new ConflictError();
    expect(err.status).toBe(409);
  });
});

describe('UnauthorizedError', () => {
  it('has status 401', () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
  });
});

describe('InternalServerError', () => {
  it('has status 500', () => {
    const err = new InternalServerError();
    expect(err.status).toBe(500);
  });
});
