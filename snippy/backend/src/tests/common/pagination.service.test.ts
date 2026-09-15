import { describe, expect, it } from 'vitest';
import { PaginationService } from '../../common/services/pagination.service';
import { config } from '../../config';

describe('PaginationService', () => {
  it('uses configured defaults', () => {
    expect(PaginationService.getPaginationParams({})).toEqual({
      page: config.pagination.defaultPage,
      limit: config.pagination.defaultLimit,
      offset: 0,
    });
  });

  it('computes offset from page and limit', () => {
    expect(PaginationService.getPaginationParams({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      offset: 20,
    });
  });

  it('clamps limit to the configured maximum', () => {
    const result = PaginationService.getPaginationParams({ page: 1, limit: 9999 });
    expect(result.limit).toBe(config.pagination.maxLimit);
  });

  it('floors page and limit at 1', () => {
    const result = PaginationService.getPaginationParams({ page: 0, limit: -5 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
    expect(result.offset).toBe(0);
  });
});
