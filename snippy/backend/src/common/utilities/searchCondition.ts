import { Op, Sequelize, WhereOptions } from 'sequelize';

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

function escapeSqlString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function qualify(tableAlias: string | undefined, name: string): string {
  return tableAlias ? `${tableAlias}.${name}` : name;
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
      const qualifiedName = qualify(tableAlias, name);
      const column = cast
        ? Sequelize.cast(Sequelize.col(qualifiedName), cast)
        : Sequelize.col(qualifiedName);
      return Sequelize.where(Sequelize.fn('LOWER', column), Op.like, pattern);
    }),
  };
}

const LIKE_SEARCH_COLUMNS: SearchColumn[] = [
  { name: 'name' },
  { name: 'description' },
  { name: 'tags', cast: 'CHAR' },
];

/**
 * Prefer MySQL FULLTEXT (`idx_snippets_ft_search` on name, description, tags_text)
 * when every token is at least 3 characters. Short queries fall back to LIKE because
 * InnoDB's default `ft_min_token_size` is 3.
 */
export function buildFullTextSearchCondition(
  q?: string | null,
  tableAlias: string = 'Snippets'
): WhereOptions | null {
  const raw = (q ?? '').trim();
  if (!raw) {
    return null;
  }

  const tokens = raw
    .replace(/[+\-><()~*"\\]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  if (tokens.some((t) => t.length < 3)) {
    return buildLikeSearchCondition(raw, LIKE_SEARCH_COLUMNS, tableAlias);
  }

  const booleanQuery = tokens.map((t) => `+${t}*`).join(' ');
  const cols = ['name', 'description', 'tags_text']
    .map((name) => `\`${qualify(tableAlias, name).replace('.', '`.`')}\``)
    .join(', ');

  return Sequelize.literal(
    `MATCH (${cols}) AGAINST (${escapeSqlString(booleanQuery)} IN BOOLEAN MODE)`
  ) as unknown as WhereOptions;
}

/** Exact tag match against the JSON array column (index-unfriendly CAST LIKE replaced). */
export function buildJsonContainsTagCondition(
  tag?: string,
  tableAlias: string = 'Snippets'
): WhereOptions | undefined {
  if (!tag?.trim()) {
    return undefined;
  }
  const value = JSON.stringify(tag.trim());
  return Sequelize.where(
    Sequelize.fn('JSON_CONTAINS', Sequelize.col(qualify(tableAlias, 'tags')), value),
    1
  );
}
