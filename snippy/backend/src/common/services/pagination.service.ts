import { PAGINATION } from '../constants/app.constants';

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
        const page = Math.max(1, parseInt(String(query.page || PAGINATION.DEFAULT_PAGE)));
        const limit = Math.min(
            PAGINATION.MAX_LIMIT,
            Math.max(1, parseInt(String(query.limit || PAGINATION.DEFAULT_LIMIT)))
        );
        const offset = (page - 1) * limit;

        return { page, limit, offset };
    }
}
