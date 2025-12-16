import { config } from '../../config';

/**
 * Pagination helper service
 */
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginationQuery {
    page?: string | number;
    limit?: string | number;
}

export class PaginationService {
    /**
     * Extract and validate pagination parameters from query
     */
    static getPaginationParams(query: PaginationQuery): PaginationParams {
        const page = Math.max(1, parseInt(String(query.page || config.pagination.defaultPage)));
        const limit = Math.min(
            config.pagination.maxLimit,
            Math.max(1, parseInt(String(query.limit || config.pagination.defaultLimit)))
        );
        const offset = (page - 1) * limit;

        return { page, limit, offset };
    }
}
