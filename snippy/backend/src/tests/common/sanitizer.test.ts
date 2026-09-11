import { describe, expect, it } from 'vitest';
import { sanitizeInput, sanitizeInputArray } from '../../common/utilities/sanitizer';

describe('sanitizeInput', () => {
  it('strips HTML tags and keeps text', () => {
    expect(sanitizeInput('<b>Hello</b> world')).toBe('Hello world');
  });

  it('returns null for empty input', () => {
    expect(sanitizeInput(null)).toBeNull();
    expect(sanitizeInput(undefined)).toBeNull();
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hi  ')).toBe('hi');
  });
});

describe('sanitizeInputArray', () => {
  it('returns null for missing input', () => {
    expect(sanitizeInputArray(null)).toBeNull();
    expect(sanitizeInputArray(undefined)).toBeNull();
  });

  it('sanitizes items and drops empties', () => {
    expect(sanitizeInputArray(['<b>one</b>', '  ', '<i>two</i>'])).toEqual(['one', 'two']);
  });
});
