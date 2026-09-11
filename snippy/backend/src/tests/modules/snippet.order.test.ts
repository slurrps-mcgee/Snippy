import { describe, expect, it } from 'vitest';
import { resolveSnippetOrder } from '../../modules/snippet/snippet.repo';

describe('resolveSnippetOrder', () => {
  it('orders by view count', () => {
    expect(resolveSnippetOrder('views')).toEqual([
      ['view_count', 'DESC'],
      ['created_at', 'DESC'],
    ]);
  });

  it('orders by favorite count', () => {
    expect(resolveSnippetOrder('favorites')).toEqual([
      ['favorite_count', 'DESC'],
      ['created_at', 'DESC'],
    ]);
  });

  it('orders by fork count', () => {
    expect(resolveSnippetOrder('forks')).toEqual([
      ['fork_count', 'DESC'],
      ['created_at', 'DESC'],
    ]);
  });

  it('defaults to newest', () => {
    expect(resolveSnippetOrder()).toEqual([['created_at', 'DESC']]);
    expect(resolveSnippetOrder('newest')).toEqual([['created_at', 'DESC']]);
    expect(resolveSnippetOrder('unknown')).toEqual([['created_at', 'DESC']]);
  });
});
