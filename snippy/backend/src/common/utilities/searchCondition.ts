import { Op, Sequelize, WhereOptions } from "sequelize";

/**
 * Column to include in a case-insensitive LIKE search condition.
 * `cast` allows non-text columns (e.g. JSON `tags`) to be cast to CHAR before comparison.
 */
export interface SearchColumn {
    name: string;
    cast?: 'CHAR';
}

/** Escape SQL LIKE wildcards (%, _) and the escape character itself so user input is matched literally. */
export function sanitizeLikeInput(q?: string | null): string {
    return (q ?? '').trim().replace(/[%_\\]/g, '\\$&');
}

/**
 * Build a case-insensitive `OR`-ed LIKE condition across the given columns, e.g.
 * `LOWER(name) LIKE '%q%' OR LOWER(description) LIKE '%q%'`.
 *
 * Returns `null` when `q` is empty/whitespace so callers can skip filtering entirely
 * (i.e. missing/empty `q` preserves existing, unfiltered behavior).
 *
 * `tableAlias` qualifies columns (e.g. `Snippets.name`, `snippet.name`) so the condition
 * can be used both on a model's own query and on associations reached via `include`.
 */
export function buildLikeSearchCondition(
    q: string | undefined | null,
    columns: SearchColumn[],
    tableAlias?: string
): WhereOptions | null {
    const sanitized = sanitizeLikeInput(q);
    if (!sanitized) {
        return null;
    }

    const pattern = `%${sanitized.toLowerCase()}%`;

    return {
        [Op.or]: columns.map(({ name, cast }) => {
            const qualifiedName = tableAlias ? `${tableAlias}.${name}` : name;
            const column = cast
                ? Sequelize.cast(Sequelize.col(qualifiedName), cast)
                : Sequelize.col(qualifiedName);
            return Sequelize.where(Sequelize.fn('LOWER', column), Op.like, pattern);
        }),
    };
}
