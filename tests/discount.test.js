import { describe, it, expect, beforeEach } from 'vitest';
import { generateDiscountCode, validateDiscountCode, getDiscountDetails, getAllDiscounts, resetDiscountStorage } from '../src/discount/index.js';
import { NotFoundError, ConflictError } from '../src/shared/errors.js';

beforeEach(() => { resetDiscountStorage(); });

describe('generateDiscountCode', () => {
  it('creates code with percentage', () => {
    const d = generateDiscountCode(15);
    expect(d.percentage).toBe(15);
    expect(d.type).toBe('manual');
  });

  it('throws for invalid percentage', () => {
    expect(() => generateDiscountCode(-1)).toThrow('must be between 0 and 100');
    expect(() => generateDiscountCode(101)).toThrow('must be between 0 and 100');
  });

  it('throws for invalid type', () => {
    expect(() => generateDiscountCode(10, 'invalid')).toThrow('Invalid discount type');
  });

  it('throws for maxUsage <= 0', () => {
    expect(() => generateDiscountCode(10, 'manual', 0)).toThrow('Max usage must be greater than 0');
  });
});

describe('validateDiscountCode', () => {
  it('increments usage count', () => {
    const d = generateDiscountCode(20);
    const v = validateDiscountCode(d.code);
    expect(v.usageCount).toBe(1);
  });

  it('throws NotFoundError for invalid code', () => {
    expect(() => validateDiscountCode('INVALID')).toThrow(NotFoundError);
  });

  it('throws ConflictError when maxUsage reached', () => {
    const d = generateDiscountCode(10, 'manual', 1);
    validateDiscountCode(d.code);
    expect(() => validateDiscountCode(d.code)).toThrow(ConflictError);
  });

  it('throws ConflictError for duplicate nth_order code', () => {
    const d = generateDiscountCode(10, 'nth_order', 2);
    validateDiscountCode(d.code);
    expect(() => validateDiscountCode(d.code)).toThrow(ConflictError);
  });

  it('allows manual code use with sufficient maxUsage', () => {
    const d = generateDiscountCode(10, 'manual', 3);
    validateDiscountCode(d.code);
    validateDiscountCode(d.code);
    const v = validateDiscountCode(d.code);
    expect(v.usageCount).toBe(3);
  });
});

describe('getDiscountDetails', () => {
  it('returns discount by code', () => {
    const d = generateDiscountCode(25);
    expect(getDiscountDetails(d.code).code).toBe(d.code);
  });

  it('throws NotFoundError for missing code', () => {
    expect(() => getDiscountDetails('NOPE')).toThrow(NotFoundError);
  });
});

describe('getAllDiscounts', () => {
  it('returns all generated discounts', () => {
    generateDiscountCode(10);
    generateDiscountCode(20);
    expect(getAllDiscounts().length).toBe(2);
  });
});