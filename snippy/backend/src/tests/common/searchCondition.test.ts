import { describe, expect, it } from 'vitest';
import { Op } from 'sequelize';
import {
  sanitizeLikeInput,
  buildLikeSearchCondition,
  buildFullTextSearchCondition,
  buildJsonContainsTagCondition,
} from '../../common/utilities/searchCondition';

describe('sanitizeLikeInput', () => {
  it('escapes LIKE wildcards', () => {
    expect(sanitizeLikeInput('100%_\\off')).toBe('100\\%\\_\\\\off');
  });

  it('trims whitespace', () => {
    expect(sanitizeLikeInput('  hello  ')).toBe('hello');
  });
});

describe('buildLikeSearchCondition', () => {
  it('returns null for empty queries', () => {
    expect(buildLikeSearchCondition('   ', [{ name: 'name' }])).toBeNull();
    expect(buildLikeSearchCondition(null, [{ name: 'name' }])).toBeNull();
  });

  it('builds an OR condition for non-empty queries', () => {
    const cond = buildLikeSearchCondition('Pen', [{ name: 'name' }, { name: 'description' }]);
    expect(cond).toBeTruthy();
    expect(cond?.[Op.or]).toHaveLength(2);
  });
});

describe('buildFullTextSearchCondition', () => {
  it('returns null for empty queries', () => {
    expect(buildFullTextSearchCondition('')).toBeNull();
  });

  it('falls back to LIKE when a token is shorter than 3 characters', () => {
    const cond = buildFullTextSearchCondition('ab');
    expect(cond?.[Op.or]).toBeTruthy();
  });

  it('uses MATCH AGAINST for longer tokens', () => {
    const cond = buildFullTextSearchCondition('hello world') as { val?: string };
    expect(String(cond?.val ?? cond)).toMatch(/MATCH/i);
    expect(String(cond?.val ?? cond)).toMatch(/BOOLEAN MODE/i);
  });
});

describe('buildJsonContainsTagCondition', () => {
  it('returns undefined when the tag is empty', () => {
    expect(buildJsonContainsTagCondition('')).toBeUndefined();
    expect(buildJsonContainsTagCondition(undefined)).toBeUndefined();
  });

  it('builds a JSON_CONTAINS condition', () => {
    const cond = buildJsonContainsTagCondition('react');
    expect(cond).toBeTruthy();
  });
});
