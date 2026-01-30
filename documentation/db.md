# Snippy Database Documentation

## Table of Contents
1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables Reference](#tables-reference)
4. [Relationships & Constraints](#relationships--constraints)
5. [Indexes & Query Optimization](#indexes--query-optimization)
6. [Cascading Deletes](#cascading-deletes)
7. [Common Queries](#common-queries)
8. [Data Integrity](#data-integrity)
9. [Migration Notes](#migration-notes)

---

## Overview

The Snippy database is a relational MySQL database managed through Sequelize ORM. It stores user profiles, code snippets, comments, and favorites with proper relationships and constraints.

**Core Entities:**
- **users** - User accounts linked to Auth0
- **snippets** - Code snippets with metadata
- **snippet_files** - Individual code files within snippets (HTML, CSS, JS)
- **favorites** - Join table for user favorite snippets
- **comments** - Comments on snippets

---

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│ (auth0_id)  │ ◄──────┐
└─────────────┘        │
      │                │ 1:Many
      │ 1:Many         │
      ├─────►┌──────────────────────────┐
      │      │    snippets              │
      │      │ (snippet_id, short_id)  │
      │      └──────────────────────────┘
      │             │
      │             │ 1:Many
      │             │
      │             ├─────►┌──────────────────────┐
      │             │      │  snippet_files       │
      │             │      │ (snippet_file_id)   │
      │             │      └──────────────────────┘
      │             │
      │             ├─────►┌──────────────────────┐
      │             │      │  comments            │
      │             │      │ (comment_id)        │
      │             │      └──────────────────────┘
      │             │
      │             ├─────►┌──────────────────────┐
      │             │      │  favorites           │
      │             │      │ (favorite_id)       │
      │             │      └──────────────────────┘
      │             │
      │             └──────► snippets (parent)
      │                   (self-referential: parent_snippet_short_id)
      │
      └─────► favorites (user's favorites)
      │
      └─────► comments (user's comments)

Legend:
  1:Many = One user can have many resources
  ◄────── = Foreign key relationship
  ──────► = Foreign key direction
```

---

## Tables Reference

### users

**Purpose:** Store user profiles linked to Auth0 authentication

**Table Name:** `users`

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `auth0_id` | VARCHAR(255) | PRIMARY KEY | Auth0 unique identifier (e.g., "auth0\|123") |
| `user_name` | VARCHAR(255) | UNIQUE, NOT NULL | Username for profile URL (auto-generated if not provided) |
| `display_name` | VARCHAR(255) | NULL | User's display name |
| `bio` | TEXT | NULL | User biography/description |
| `picture_url` | VARCHAR(255) | NULL | Profile picture URL |
| `is_admin` | BOOLEAN | DEFAULT: false | Admin flag for future admin features |
| `is_private` | BOOLEAN | DEFAULT: false | Privacy setting for user profile |
| `created_at` | TIMESTAMP | NOT NULL | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
```sql
PRIMARY KEY (auth0_id)
UNIQUE KEY (user_name)
INDEX idx_users_username (user_name)
INDEX idx_users_display_name (display_name)
```

**Sample Data:**
```json
{
  "auth0_id": "auth0|6123abc456def",
  "user_name": "john_doe",
  "display_name": "John Doe",
  "bio": "Full-stack developer",
  "picture_url": "https://auth0.com/pictures/...",
  "is_admin": false,
  "is_private": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

---

### snippets

**Purpose:** Store code snippet metadata and references

**Table Name:** `snippets`

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `snippet_id` | UUID | PRIMARY KEY | Unique identifier for snippet |
| `auth0_id` | VARCHAR(255) | FOREIGN KEY → users(auth0_id), NOT NULL | Owner of the snippet |
| `short_id` | VARCHAR(16) | UNIQUE, NOT NULL | URL-friendly short identifier (auto-generated) |
| `name` | VARCHAR(255) | NOT NULL | Snippet title |
| `description` | VARCHAR(255) | NULL | Snippet description |
| `tags` | JSON | NULL | Array of search tags |
| `is_private` | BOOLEAN | DEFAULT: false | Privacy setting |
| `parent_snippet_short_id` | VARCHAR(16) | FK → snippets(short_id), NULL | Parent if forked |
| `view_count` | INT | DEFAULT: 0 | Total views |
| `fork_count` | INT | DEFAULT: 0 | Number of forks |
| `favorite_count` | INT | DEFAULT: 0 | Number of favorites |
| `comment_count` | INT | DEFAULT: 0 | Number of comments |
| `external_resources` | JSON | DEFAULT: [] | CDN scripts/stylesheets |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
```sql
PRIMARY KEY (snippet_id)
UNIQUE KEY (short_id)
FOREIGN KEY (auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE
FOREIGN KEY (parent_snippet_short_id) REFERENCES snippets(short_id)
INDEX idx_snippets_auth0 (auth0_id)
INDEX idx_snippets_short_id (short_id)
INDEX idx_snippets_parent (parent_snippet_short_id)
INDEX idx_snippets_view_count (view_count)
INDEX idx_snippets_fork_count (fork_count)
INDEX idx_snippets_favorite_count (favorite_count)
INDEX idx_snippets_auth0_private (auth0_id, is_private)
INDEX idx_snippets_private_created (is_private, created_at)
INDEX idx_snippets_name_search (name)
INDEX idx_snippets_description_search (description)
```

**Sample Data:**
```json
{
  "snippet_id": "550e8400-e29b-41d4-a716-446655440000",
  "auth0_id": "auth0|6123abc456def",
  "short_id": "xyz123",
  "name": "React Counter Component",
  "description": "Simple counter with increment/decrement",
  "tags": ["react", "javascript", "component"],
  "is_private": false,
  "parent_snippet_short_id": null,
  "view_count": 42,
  "fork_count": 3,
  "favorite_count": 7,
  "comment_count": 2,
  "external_resources": [
    { "type": "script", "url": "https://cdn.jsdelivr.net/npm/react@18/..." }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

---

### snippet_files

**Purpose:** Store individual code files within a snippet

**Table Name:** `snippet_files`

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `snippet_file_id` | UUID | PRIMARY KEY | Unique identifier for file |
| `snippet_id` | UUID | FOREIGN KEY → snippets(snippet_id), NOT NULL | Parent snippet |
| `file_type` | ENUM('html','css','js') | NOT NULL | Code language type |
| `content` | LONGTEXT | NULL | Code content |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraint:**
```sql
UNIQUE (snippet_id, file_type)  -- Only one HTML, one CSS, one JS per snippet
```

**Indexes:**
```sql
PRIMARY KEY (snippet_file_id)
FOREIGN KEY (snippet_id) REFERENCES snippets(snippet_id) ON DELETE CASCADE
UNIQUE INDEX unique_snippet_file_type_per_snippet (snippet_id, file_type)
```

**Sample Data:**
```json
{
  "snippet_file_id": "660e8400-e29b-41d4-a716-446655440001",
  "snippet_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_type": "html",
  "content": "<div id='root'><button>0</button></div>",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

---

### favorites

**Purpose:** Join table linking users to their favorite snippets

**Table Name:** `favorites`

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `favorite_id` | UUID | PRIMARY KEY | Unique identifier for favorite record |
| `auth0_id` | VARCHAR(255) | FOREIGN KEY → users(auth0_id), NOT NULL | User who favorited |
| `snippet_id` | UUID | FOREIGN KEY → snippets(snippet_id), NOT NULL | Favorited snippet |
| `created_at` | TIMESTAMP | NOT NULL | Favorite creation timestamp |

**Unique Constraint:**
```sql
UNIQUE (auth0_id, snippet_id)  -- Each user can favorite a snippet only once
```

**Indexes:**
```sql
PRIMARY KEY (favorite_id)
FOREIGN KEY (auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE
FOREIGN KEY (snippet_id) REFERENCES snippets(snippet_id) ON DELETE CASCADE
UNIQUE INDEX idx_favorites_user_snippet (auth0_id, snippet_id)
INDEX idx_favorites_auth0 (auth0_id)
INDEX idx_favorites_snippet (snippet_id)
```

**Sample Data:**
```json
{
  "favorite_id": "770e8400-e29b-41d4-a716-446655440002",
  "auth0_id": "auth0|6123abc456def",
  "snippet_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-20T12:00:00Z"
}
```

---

### comments

**Purpose:** Store comments on snippets

**Table Name:** `comments`

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `comment_id` | UUID | PRIMARY KEY | Unique identifier for comment |
| `auth0_id` | VARCHAR(255) | FOREIGN KEY → users(auth0_id), NOT NULL | Comment author |
| `snippet_id` | UUID | FOREIGN KEY → snippets(snippet_id), NOT NULL | Commented snippet |
| `content` | TEXT | NOT NULL | Comment text |
| `created_at` | TIMESTAMP | NOT NULL | Comment creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
```sql
PRIMARY KEY (comment_id)
FOREIGN KEY (auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE
FOREIGN KEY (snippet_id) REFERENCES snippets(snippet_id) ON DELETE CASCADE
INDEX idx_comments_auth0 (auth0_id)
INDEX idx_comments_snippet (snippet_id)
INDEX idx_comments_snippet_created (snippet_id, created_at)
```

**Sample Data:**
```json
{
  "comment_id": "880e8400-e29b-41d4-a716-446655440003",
  "auth0_id": "auth0|abc123",
  "snippet_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Great example! Really helped me understand React hooks.",
  "created_at": "2024-01-20T14:15:00Z",
  "updated_at": "2024-01-20T14:15:00Z"
}
```

---

## Relationships & Constraints

### One-to-Many: users → snippets

**Relationship:** One user can create many snippets

```typescript
// In users entity
@HasMany(() => Snippets, {
  foreignKey: 'auth0Id',
  sourceKey: 'auth0Id',
  constraints: false,
})
snippets!: Snippets[];

// In snippets entity
@BelongsTo(() => Users, {
  foreignKey: 'auth0Id',
  targetKey: 'auth0Id',
  onDelete: 'CASCADE',
  constraints: true,
})
user!: Users;
```

**Cascade Behavior:** When user is deleted, all their snippets are deleted

---

### One-to-Many: snippets → snippet_files

**Relationship:** One snippet contains many files (HTML, CSS, JS)

```typescript
// In snippets entity
@HasMany(() => SnippetFiles, {
  foreignKey: 'snippetId',
  sourceKey: 'snippetId',
  constraints: false,
})
snippetFiles!: SnippetFiles[];

// In snippet_files entity
@BelongsTo(() => Snippets, {
  foreignKey: 'snippetId',
  targetKey: 'snippetId',
  onDelete: 'CASCADE',
  constraints: true,
})
snippet!: Snippets;
```

**Constraint:** Only one file of each type per snippet (UNIQUE on snippet_id, file_type)

**Cascade Behavior:** When snippet is deleted, all its files are deleted

---

### One-to-Many: users → favorites

**Relationship:** One user can favorite many snippets

```typescript
// In users entity
@HasMany(() => Favorites, {
  foreignKey: 'auth0Id',
  sourceKey: 'auth0Id',
  constraints: false,
})
favorites!: Favorites[];

// In favorites entity
@BelongsTo(() => Users, {
  foreignKey: 'auth0Id',
  targetKey: 'auth0Id',
  onDelete: 'CASCADE',
  constraints: true,
})
user!: Users;
```

**Cascade Behavior:** When user is deleted, their favorites are deleted

---

### One-to-Many: snippets → favorites

**Relationship:** One snippet can be favorited by many users

```typescript
// In snippets entity
@HasMany(() => Favorites, {
  foreignKey: 'snippetId',
  sourceKey: 'snippetId',
  constraints: false,
})
favorites!: Favorites[];

// In favorites entity
@BelongsTo(() => Snippets, {
  foreignKey: 'snippetId',
  targetKey: 'snippetId',
  onDelete: 'CASCADE',
  constraints: true,
})
snippet!: Snippets;
```

**Cascade Behavior:** When snippet is deleted, its favorite records are deleted

---

### One-to-Many: users → comments

**Relationship:** One user can write many comments

```typescript
// In users entity
@HasMany(() => Comments, {
  foreignKey: 'auth0Id',
  sourceKey: 'auth0Id',
  constraints: false,
})
comments!: Comments[];

// In comments entity
@BelongsTo(() => Users, {
  foreignKey: 'auth0Id',
  targetKey: 'auth0Id',
  onDelete: 'CASCADE',
  constraints: true,
})
user!: Users;
```

**Cascade Behavior:** When user is deleted, their comments are deleted

---

### One-to-Many: snippets → comments

**Relationship:** One snippet can have many comments

```typescript
// In snippets entity
@HasMany(() => Comments, {
  foreignKey: 'snippetId',
  sourceKey: 'snippetId',
  constraints: false,
})
comments!: Comments[];

// In comments entity
@BelongsTo(() => Snippets, {
  foreignKey: 'snippetId',
  targetKey: 'snippetId',
  onDelete: 'CASCADE',
  constraints: true,
})
snippet!: Snippets;
```

**Cascade Behavior:** When snippet is deleted, its comments are deleted

---

### Self-Referential: snippets → snippets (Fork Parent)

**Relationship:** A snippet can be forked from another snippet

```typescript
// Parent reference (if this is a fork)
@BelongsTo(() => Snippets, {
  foreignKey: 'parent_snippet_short_id',
  targetKey: 'shortId',
  constraints: false,
})
parent?: Snippets;

// Children (forks of this snippet)
@HasMany(() => Snippets, {
  foreignKey: 'parent_snippet_short_id',
  sourceKey: 'shortId',
  constraints: false,
})
forks!: Snippets[];
```

**Constraint:** `parent_snippet_short_id` is nullable; NULL means original snippet, not a fork

**No Cascade:** Deleting parent snippet doesn't affect forks (they retain the parent_short_id value)

---

## Indexes & Query Optimization

### Index Strategy

Indexes are created on columns used in:
- WHERE clauses (filtering)
- JOIN conditions (relationships)
- ORDER BY clauses (sorting)
- UNIQUE constraints

### Index Summary

**users table:**
- `username` - Fast profile URL lookups
- `display_name` - Fast display searches

**snippets table:**
- `auth0_id` - Find user's snippets
- `short_id` - URL lookups (unique)
- `parent_snippet_short_id` - Find snippet forks
- `is_private, created_at` - Public feed queries
- `view_count`, `fork_count`, `favorite_count` - Trending queries
- `name`, `description` - Full-text search

**snippet_files table:**
- `snippet_id, file_type` - Unique constraint (fetch specific file type)

**favorites table:**
- `auth0_id, snippet_id` - Unique constraint (check if already favorited)
- `auth0_id` - User's favorites list
- `snippet_id` - Snippet's favorite count

**comments table:**
- `snippet_id, created_at` - Fetch comment thread with ordering
- `auth0_id` - User's comments
- `snippet_id` - Snippet's comments

---

## Cascading Deletes

When records are deleted, cascading can affect other records:

### User Deletion

```
User deleted
  ├─ Snippets (user's snippets) deleted
  │   ├─ SnippetFiles deleted (cascade)
  │   ├─ Comments on those snippets deleted (cascade)
  │   └─ Favorites of those snippets deleted (cascade)
  │
  ├─ Favorites (user's favorites) deleted (cascade)
  │   └─ snippets.favorite_count decremented
  │
  └─ Comments (user's comments) deleted (cascade)
      └─ snippets.comment_count decremented
```

### Snippet Deletion

```
Snippet deleted
  ├─ SnippetFiles deleted (cascade)
  ├─ Comments on snippet deleted (cascade)
  ├─ Favorites of snippet deleted (cascade)
  └─ Forks (children) NOT deleted (parent_snippet_short_id becomes orphaned)
```

### Favorite Record Deletion

```
Favorite deleted
  ├─ Snippet remains
  ├─ User remains
  └─ snippets.favorite_count decremented (in service layer, not DB)
```

### Comment Deletion

```
Comment deleted
  ├─ Snippet remains
  ├─ User remains
  └─ snippets.comment_count decremented (in service layer, not DB)
```

---

## Common Queries

### Get User's Snippets

```sql
SELECT s.* FROM snippets s
WHERE s.auth0_id = ? AND s.is_private = false
ORDER BY s.created_at DESC
LIMIT 10 OFFSET 0;
```

**Uses indexes:** `idx_snippets_auth0_private`

---

### Get Snippet by Short ID (with all data)

```sql
SELECT s.*, sf.*, u.user_name, u.display_name
FROM snippets s
LEFT JOIN snippet_files sf ON s.snippet_id = sf.snippet_id
LEFT JOIN users u ON s.auth0_id = u.auth0_id
WHERE s.short_id = ?;
```

**Uses indexes:** `idx_snippets_short_id`

---

### Get Public Feed (trending)

```sql
SELECT s.* FROM snippets s
WHERE s.is_private = false
ORDER BY s.view_count DESC
LIMIT 20;
```

**Uses indexes:** `idx_snippets_private_created`, `idx_snippets_view_count`

---

### Get User's Favorites

```sql
SELECT s.* FROM snippets s
JOIN favorites f ON s.snippet_id = f.snippet_id
WHERE f.auth0_id = ?
ORDER BY f.created_at DESC
LIMIT 10;
```

**Uses indexes:** `idx_favorites_auth0`

---

### Get Comments on Snippet

```sql
SELECT c.*, u.user_name, u.display_name
FROM comments c
JOIN users u ON c.auth0_id = u.auth0_id
WHERE c.snippet_id = ?
ORDER BY c.created_at DESC;
```

**Uses indexes:** `idx_comments_snippet_created`

---

### Find All Forks of a Snippet

```sql
SELECT s.* FROM snippets s
WHERE s.parent_snippet_short_id = ?
ORDER BY s.created_at DESC;
```

**Uses indexes:** `idx_snippets_parent`

---

### Search Snippets

```sql
SELECT s.* FROM snippets s
WHERE s.is_private = false
AND (s.name LIKE ? OR s.description LIKE ?)
ORDER BY s.created_at DESC
LIMIT 20;
```

**Uses indexes:** `idx_snippets_name_search`, `idx_snippets_description_search`

---

## Data Integrity

### Unique Constraints

1. **users.user_name** - No duplicate usernames
2. **snippets.short_id** - No duplicate short IDs
3. **snippet_files** - Only one file per type per snippet
4. **favorites** - User can favorite a snippet only once

### Foreign Key Constraints

All relationships with `onDelete: 'CASCADE'` ensure referential integrity:
- Orphaned records cannot exist
- Deleting parent automatically cleans up children

### Auto-Generated Values

- `users.user_name` - Generated if not provided by Auth0
- `snippets.short_id` - Generated from snippet name (must be unique)
- All UUIDs - Generated by database

---

## Migration Notes

### Adding New Columns

When adding columns to existing tables:

1. **Nullable columns** - Can be added immediately
2. **Non-nullable columns** - Require data migration or default values
3. **Indexes** - Add separately after data migration

### Typical Migration Process

```sql
-- 1. Add new nullable column
ALTER TABLE snippets ADD COLUMN new_field VARCHAR(255) NULL;

-- 2. Backfill existing data
UPDATE snippets SET new_field = 'default_value' WHERE new_field IS NULL;

-- 3. Make non-nullable if desired
ALTER TABLE snippets MODIFY COLUMN new_field VARCHAR(255) NOT NULL;

-- 4. Add index
CREATE INDEX idx_snippets_new_field ON snippets(new_field);
```

### Backup Before Migrations

Always backup production database before schema changes:

```bash
docker-compose exec db mysqldump -u root -p --all-databases > backup.sql
```

---

## Summary

**Key Points:**

1. **Relational Design** - Proper foreign keys maintain data integrity
2. **Cascading Deletes** - Deleting users/snippets automatically cleans up related data
3. **Indexes on FK** - Foreign keys and frequently-queried columns are indexed
4. **Unique Constraints** - Prevent duplicate data where appropriate
5. **Timestamps** - All tables track creation and update times
6. **UUID Primary Keys** - Better for distributed systems than auto-increment
7. **Short IDs** - User-friendly URLs instead of exposing UUIDs

This structure ensures data consistency, query performance, and maintainability of the Snippy platform.
