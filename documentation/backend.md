# Snippy Backend Architecture & API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Layers](#architecture-layers)
4. [Database Schema](#database-schema)
5. [API Endpoints Quick Reference](#api-endpoints-quick-reference)
6. [Detailed API Endpoints](#detailed-api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Middleware](#middleware)
9. [Error Handling](#error-handling)
10. [Data Access Layer](#data-access-layer)
11. [Service Layer](#service-layer)
12. [Request/Response Flow](#requestresponse-flow)
13. [Best Practices](#best-practices)
14. [Debugging Tips](#debugging-tips)

---

## Overview

The Snippy backend is a Node.js/Express REST API built with TypeScript that provides snippet management, user profiles, favorites, and comments. It uses Sequelize ORM for database operations, Auth0 for authentication, and follows a layered architecture pattern.

**Key Features:**
- User authentication via Auth0
- Create, read, update, delete snippets
- Fork snippets with parent tracking
- Comment on snippets
- Favorite snippets
- Search snippets by name/description
- Track snippet views
- Public/private snippet management
- Admin functionality (pending)

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MySQL with Sequelize ORM
- **Authentication:** Auth0 (JWT bearer tokens)
- **Validation:** Custom validators
- **Documentation:** Swagger/OpenAPI
- **Storage:** MinIO (disabled, for future file uploads)
- **Logging:** Custom logger with Winston/Pino pattern
- **Security:** Helmet, CORS, rate limiting

---

## Architecture Layers

### Layer Structure

```
Request → Middleware → Controller → Service → Repository → Database
  ↓         (Auth0)   (Validation) (Logic)   (SQL/Queries)
  ↓         (Logging)
  ↓
Response ← Middleware ← Controller ← Service ← Repository
(Serialized) (Error Handler) (DTO Mapping) (Transactions)
```

### Responsibility Breakdown

**Controller Layer** (`modules/*/_.controller.ts`)
- Receives HTTP requests
- Validates input using validators
- Calls service handlers
- Serializes response (DTO mapping)
- Catches and forwards errors to global error handler

**Service Layer** (`modules/*/_.service.ts`)
- Business logic (authorization, calculations)
- Orchestrates repository calls
- Manages database transactions
- Maps entities to DTOs for API responses
- Throws CustomError for error handling

**Repository Layer** (`modules/*/_.repo.ts`)
- Direct database access using Sequelize
- CRUD operations
- Query building
- Respects database constraints

**Entity Layer** (`entities/*.entity.ts`)
- Sequelize model definitions
- Column types and constraints
- Relationships (hasMany, belongsTo)
- Hooks (beforeCreate, etc.)

---

## Database Schema

### Entity Relationships

```
Users (1) ──────────── (Many) Snippets
  │                       │
  ├── Snippets           ├── SnippetFiles
  ├── Favorites          ├── Favorites
  └── Comments           └── Comments

Users (Many) ←────────→ (Many) Favorites ←────────→ (Many) Snippets
                        (Join Table)

Users (Many) ──→ Comments ←─ (Many) Snippets
```

### Entities

#### Users

**Purpose:** Store user profiles linked to Auth0 identities

```typescript
Users {
  auth0Id: string (PK)        // Auth0 unique ID
  userName: string (UNIQUE)   // Username for profile URL
  displayName: string         // User's display name
  email: string              // Email address
  picture: string            // Profile picture URL
  bio: string                // User bio/description
  createdAt: timestamp       // Account creation time
  updatedAt: timestamp       // Last update time
  
  Relationships:
  - HasMany Snippets (auth0Id)
  - HasMany Favorites (auth0Id)
  - HasMany Comments (auth0Id)
  
  Indexes:
  - idx_users_username (for profile lookups)
  - idx_users_display_name (for display)
}
```

#### Snippets

**Purpose:** Store code snippets with metadata

```typescript
Snippets {
  snippetId: UUID (PK)          // Unique snippet ID
  auth0Id: string (FK→Users)    // Owner of snippet
  shortId: string (UNIQUE)      // Short URL identifier (auto-generated)
  name: string                  // Snippet title
  description: string           // Snippet description
  tags: string[]               // Search tags
  isPrivate: boolean           // Visibility setting
  parentShortId: string        // Parent snippet if forked
  viewCount: number            // Times viewed
  forkCount: number            // Number of forks
  favoriteCount: number        // Number of favorites
  commentCount: number         // Number of comments
  externalResources: object    // CDN scripts/stylesheets
  createdAt: timestamp
  updatedAt: timestamp
  
  Relationships:
  - BelongsTo User (auth0Id)
  - HasMany SnippetFiles (snippetId)
  - HasMany Favorites (snippetId)
  - HasMany Comments (snippetId)
  
  Indexes:
  - idx_snippets_auth0 (finding user's snippets)
  - idx_snippets_short_id (URL lookups)
  - idx_snippets_parent (finding forks)
  - idx_snippets_auth0_private (user's private snippets)
  - idx_snippets_view_count (trending)
  - idx_snippets_name_search (search)
  - idx_snippets_description_search (search)
}
```

#### SnippetFiles

**Purpose:** Store individual code files within a snippet

```typescript
SnippetFiles {
  snippetFileID: UUID (PK)      // Unique file ID
  snippetId: UUID (FK)          // Parent snippet
  fileType: string              // 'html' | 'css' | 'javascript'
  content: longtext             // Code content
  createdAt: timestamp
  updatedAt: timestamp
  
  Relationships:
  - BelongsTo Snippet (snippetId)
}
```

#### Favorites

**Purpose:** Join table linking users to favorite snippets

```typescript
Favorites {
  favoriteId: UUID (PK)         // Unique favorite record
  auth0Id: string (FK→Users)    // User who favorited
  snippetId: UUID (FK→Snippets) // Favorited snippet
  createdAt: timestamp
  
  Relationships:
  - BelongsTo User (auth0Id)
  - BelongsTo Snippet (snippetId)
  
  Constraints:
  - Unique on (auth0Id, snippetId)
}
```

#### Comments

**Purpose:** Store comments on snippets

```typescript
Comments {
  commentId: UUID (PK)          // Unique comment ID
  auth0Id: string (FK→Users)    // Comment author
  snippetId: UUID (FK→Snippets) // Commented snippet
  content: text                 // Comment text
  createdAt: timestamp
  updatedAt: timestamp
  
  Relationships:
  - BelongsTo User (auth0Id)
  - BelongsTo Snippet (snippetId)
}
```

---

## API Endpoints Quick Reference

### All Endpoints at a Glance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **SNIPPET ENDPOINTS** |
| POST | `/api/v1/snippets` | ✓ | Create new snippet |
| GET | `/api/v1/snippets/:shortId` | ○ | Get snippet by short ID |
| PUT | `/api/v1/snippets/:shortId` | ✓ | Update snippet (owner only) |
| DELETE | `/api/v1/snippets/:shortId` | ✓ | Delete snippet (owner only) |
| POST | `/api/v1/snippets/:snippetId/fork` | ✓ | Fork a snippet |
| GET | `/api/v1/snippets/my-snippets` | ✓ | Get user's snippets (paginated) |
| GET | `/api/v1/snippets/user/:userName` | ○ | Get user's public snippets |
| GET | `/api/v1/snippets` | ○ | Get all public snippets (paginated) |
| GET | `/api/v1/snippets/search` | ○ | Search snippets by query |
| POST | `/api/v1/snippets/:snippetId/view` | ○ | Increment view count |
| **FAVORITE ENDPOINTS** |
| POST | `/api/v1/favorites` | ✓ | Add snippet to favorites |
| DELETE | `/api/v1/favorites/:snippetId` | ✓ | Remove from favorites |
| GET | `/api/v1/favorites/my-favorites` | ✓ | Get user's favorites (paginated) |
| **COMMENT ENDPOINTS** |
| POST | `/api/v1/comments` | ✓ | Create comment on snippet |
| DELETE | `/api/v1/comments/:commentId` | ✓ | Delete comment (author only) |
| GET | `/api/v1/comments/snippet/:snippetId` | ○ | Get snippet's comments (paginated) |
| **USER ENDPOINTS** |
| GET | `/api/v1/users/:userName` | ○ | Get user profile |
| GET | `/api/v1/users/me` | ✓ | Get current user profile |
| PUT | `/api/v1/users/me` | ✓ | Update current user profile |

**Legend:**
- ✓ = Authentication required (Bearer token)
- ○ = Optional / Public

### Query Parameters

**Pagination (for GET endpoints returning lists):**
```
?page=1           // Page number (default: 1)
&limit=10         // Items per page (default: 10)
&sort=created_at:DESC  // Sort field and direction
```

**Search:**
```
?query=react      // Search term (searches name and description)
```

---

## Detailed API Endpoints

### Snippet Endpoints

#### Create Snippet
```
POST /api/v1/snippets
Auth: Required (Bearer Token)
Body: CreateSnippetRequest
├── name: string
├── description: string
├── tags: string[]
├── isPrivate: boolean
├── externalResources: object
└── snippetFiles: SnippetFile[]
    ├── fileType: 'html'|'css'|'js'
    └── content: string

Response: 201 Created
{
  success: true,
  snippet: SnippetDTO
}
```

#### Get Snippet by Short ID
```
GET /api/v1/snippets/:shortId
Auth: Optional (public for non-private)
Response: 200 OK
{
  success: true,
  snippet: SnippetDTO
}
```

#### Update Snippet
```
PUT /api/v1/snippets/:shortId
Auth: Required (owner only)
Body: UpdateSnippetRequest
├── name: string (optional)
├── description: string (optional)
├── tags: string[] (optional)
├── isPrivate: boolean (optional)
└── snippetFiles: SnippetFile[] (optional)

Protected Fields (cannot be updated):
- snippetId, auth0Id, shortId, parentShortId

Response: 200 OK
{
  success: true,
  snippet: SnippetDTO
}
```

#### Delete Snippet
```
DELETE /api/v1/snippets/:shortId
Auth: Required (owner only)
Response: 204 No Content
  or 200 OK { success: true }
```

#### Fork Snippet
```
POST /api/v1/snippets/:snippetId/fork
Auth: Required
Response: 201 Created
{
  success: true,
  snippet: SnippetDTO (with parentShortId set)
}
```

#### Get My Snippets (Paginated)
```
GET /api/v1/snippets/my-snippets?page=1&limit=10&sort=created_at:DESC
Auth: Required
Response: 200 OK
{
  success: true,
  snippets: SnippetDTO[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    pages: number
  }
}
```

#### Get User's Public Snippets
```
GET /api/v1/snippets/user/:userName?page=1&limit=10
Auth: Optional
Response: 200 OK
{
  success: true,
  snippets: SnippetDTO[],
  pagination: PaginationMeta
}
```

#### Get All Public Snippets
```
GET /api/v1/snippets?page=1&limit=10&sort=created_at:DESC
Auth: Optional
Response: 200 OK
{
  success: true,
  snippets: SnippetDTO[],
  pagination: PaginationMeta
}
```

#### Search Snippets
```
GET /api/v1/snippets/search?query=react&page=1&limit=10
Auth: Optional
Response: 200 OK
{
  success: true,
  snippets: SnippetDTO[],
  pagination: PaginationMeta
}
```

#### Increment View Count
```
POST /api/v1/snippets/:snippetId/view
Auth: Optional
Response: 200 OK
{
  success: true
}
```

### Favorite Endpoints

#### Add Favorite
```
POST /api/v1/favorites
Auth: Required
Body:
{
  snippetId: string
}
Response: 201 Created
{
  success: true,
  favorite: FavoriteDTO
}
```

#### Remove Favorite
```
DELETE /api/v1/favorites/:snippetId
Auth: Required
Response: 204 No Content
```

#### Get User's Favorites
```
GET /api/v1/favorites/my-favorites?page=1&limit=10
Auth: Required
Response: 200 OK
{
  success: true,
  favorites: FavoriteDTO[],
  pagination: PaginationMeta
}
```

### Comment Endpoints

#### Create Comment
```
POST /api/v1/comments
Auth: Required
Body:
{
  snippetId: string,
  content: string
}
Response: 201 Created
{
  success: true,
  comment: CommentDTO
}
```

#### Delete Comment
```
DELETE /api/v1/comments/:commentId
Auth: Required (author only)
Response: 204 No Content
```

#### Get Snippet's Comments
```
GET /api/v1/comments/snippet/:snippetId?page=1&limit=20
Auth: Optional
Response: 200 OK
{
  success: true,
  comments: CommentDTO[],
  pagination: PaginationMeta
}
```

### User Endpoints

#### Get User Profile
```
GET /api/v1/users/:userName
Auth: Optional
Response: 200 OK
{
  success: true,
  user: UserDTO
}
```

#### Get Current User Profile
```
GET /api/v1/users/me
Auth: Required
Response: 200 OK
{
  success: true,
  user: UserDTO
}
```

#### Update User Profile
```
PUT /api/v1/users/me
Auth: Required
Body: Partial<UserDTO>
├── displayName: string (optional)
├── bio: string (optional)
└── picture: string (optional)

Protected Fields (cannot be updated):
- auth0Id, userName, email

Response: 200 OK
{
  success: true,
  user: UserDTO
}
```

---

## Authentication & Authorization

### Auth0 Integration

**Flow:**
```
Frontend (Angular)
    ↓ (requests access token)
Auth0
    ↓ (returns JWT token)
Frontend
    ↓ (includes token in Authorization header)
Backend
    ↓ (auth0Check middleware)
Extract & Validate Token
    ↓
Attach decoded payload to req.auth
    ↓
Continue to route handler
```

### Auth0 Middleware

**File:** `src/common/middleware/auth0.service.ts`

```typescript
auth0Check(req, res, next):
├── Get token from Authorization header
├── Verify JWT signature using Auth0 JWKS
├── Extract sub (Auth0 ID) from decoded token
└── Attach to req.auth = { payload: { sub: auth0Id } }
```

**Token Expected Format:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Decoded Payload Contains:**
```typescript
{
  sub: "auth0|...",       // Auth0 ID (primary key)
  email: "user@...",
  email_verified: boolean,
  aud: string,
  iat: number,            // Issued at
  exp: number,            // Expiration
  ...other Auth0 claims
}
```

### Authorization

**Ownership Check Pattern:**

```typescript
// In service handler:
const auth0Id = payload.auth?.payload?.sub
const snippet = await findBySnippetId(snippetId)

if (snippet.auth0Id !== auth0Id) {
  throw new CustomError("Unauthorized", 401)
}
// Proceed with update
```

**Visibility Check Pattern:**

```typescript
// Public snippet - anyone can view
if (!snippet.isPrivate) {
  return snippet
}

// Private snippet - only owner
if (snippet.auth0Id === auth0Id) {
  return snippet
}

throw new CustomError("Forbidden", 403)
```

---

## Middleware

### Execution Order

```
Request
  ↓
1. Cookie Parser
  ↓
2. Helmet (Security headers)
  ↓
3. CORS (Origin check)
  ↓
4. Global Rate Limiter
  ↓
5. Express JSON (Parse body)
  ↓
6. Auth0 Check (JWT validation)
  ↓
7. Routes
  ↓
8. Error Handler (Last middleware)
  ↓
Response
```

### Cookie Parser
- Parses incoming cookies
- Populates `req.cookies`

### Helmet
- Sets security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Protects against common attacks

### CORS
```typescript
{
  origin: config.frontend.url,  // Allow only from frontend
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true             // Allow cookies
}
```

### Global Rate Limiter
- Basic DOS protection
- Limits requests per IP
- Default: 100 requests per 15 minutes (configurable)

### Auth0 Check
- Validates JWT tokens
- Extracts Auth0 ID
- Protects all routes after middleware

### Error Handler
```typescript
errorHandler(err, req, res, next):
├── Check if CustomError
├── Extract status code (or default 500)
├── Log error with context
└── Send JSON response { error: message }
```

---

## Error Handling

### Custom Error Class

```typescript
class CustomError extends Error {
  statusCode: number
  
  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
  }
}
```

### Error Codes

```
200 OK                           Success
201 Created                      Resource created
204 No Content                   Success (no body)
400 Bad Request                  Validation error
401 Unauthorized                 Auth required / invalid token
403 Forbidden                    Insufficient permissions
404 Not Found                    Resource not found
409 Conflict                     Unique constraint violation
500 Internal Server Error        Unexpected error
```

### Error Flow

```typescript
// In repository
if (!found) throw new Error('Not found')

// In service
try {
  // repo call
} catch (err) {
  handleError(err, 'serviceName')  // Maps to CustomError
}

// handleError function
export function handleError(err, method): never {
  if (err instanceof CustomError) throw err  // Already mapped
  
  // Map Sequelize errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    throw new CustomError('Conflict', 409)
  }
  if (err.name === 'SequelizeValidationError') {
    throw new CustomError(err.message, 400)
  }
  // ... other Sequelize mappings
  
  throw new CustomError('Database error', 500)
}

// In controller
try {
  const result = await service()
  res.status(200).json(result)
} catch (error) {
  next(error)  // Pass to error handler middleware
}

// Error handler catches CustomError
// Sends: { error: "message" }
```

### Response Format

**Success:**
```json
{
  "success": true,
  "snippet": { ... }
}
```

**Error:**
```json
{
  "error": "Validation failed"
}
```

---

## Data Access Layer

### Repository Pattern

Each module has a repository file (`*.repo.ts`) that encapsulates all database queries.

**Example: Snippet Repository**

```typescript
// CREATE
export async function createSnippet(
  snippetData: Partial<Snippets>,
  transaction?: Transaction
): Promise<Snippets>

// READ
export async function findBySnippetId(
  snippetId: string,
  transaction?: Transaction
): Promise<Snippets | null>

export async function findByShortId(
  shortId: string,
  transaction?: Transaction
): Promise<Snippets | null>

// UPDATE
export async function updateSnippet(
  snippetId: string,
  patch: Partial<Snippets>,
  transaction?: Transaction
): Promise<void>

// DELETE
export async function deleteSnippet(
  snippetId: string,
  transaction?: Transaction
): Promise<void>

// ADVANCED
export async function searchSnippets(
  query: string,
  pagination: PaginationQuery
): Promise<{ rows: Snippets[]; count: number }>
```

### Transaction Support

Repositories support optional `transaction` parameter for multi-step operations:

```typescript
export async function forkSnippet(snippetId: string, auth0Id: string) {
  return await executeInTransaction(async (t) => {
    // All repo calls with { transaction: t } are part of same transaction
    const original = await findBySnippetId(snippetId, t)
    const fork = await createSnippet({
      auth0Id,
      parentShortId: original.shortId,
      ...copyData
    }, t)
    await createSnippetFiles(files, t)
    
    // If any call throws, all changes are rolled back
    return fork
  }, 'forkSnippet')
}
```

### Relationships

Eager loading in queries:

```typescript
export async function findBySnippetId(snippetId: string) {
  return await Snippets.findByPk(snippetId, {
    include: [
      SnippetFiles,  // Include all files
      {
        model: Users,
        attributes: ['userName', 'displayName']  // Only specific fields
      }
    ]
  })
}
```

---

## Service Layer

### Service Handler Pattern

```typescript
export async function getSnippetHandler(
  payload: ServicePayload<unknown, { snippetId: string }>
): Promise<ServiceResponse<SnippetDTO>> {
  try {
    // 1. Extract data
    const { snippetId } = payload.params
    const { sub: auth0Id } = payload.auth?.payload || {}
    
    // 2. Validation
    if (!snippetId) {
      throw new CustomError('Snippet ID required', 400)
    }
    
    // 3. Authorization
    const snippet = await findBySnippetId(snippetId)
    if (!snippet) {
      throw new CustomError('Not found', 404)
    }
    if (snippet.isPrivate && snippet.auth0Id !== auth0Id) {
      throw new CustomError('Forbidden', 403)
    }
    
    // 4. Increment view count
    await incrementSnippetViewCount(snippetId)
    
    // 5. Return mapped response
    return {
      snippet: SnippetMapper.toDTO(snippet, auth0Id)
    }
  } catch (err) {
    handleError(err, 'getSnippetHandler')
  }
}
```

### ServicePayload Type

```typescript
interface ServicePayload<Body = any, Params = any> {
  body?: Body
  params?: Params
  query?: QueryParams
  auth?: {
    payload: {
      sub: string  // Auth0 ID
    }
  }
}
```

### ServiceResponse Type

```typescript
interface ServiceResponse<T> {
  [key: string]: T | any
}

// Example response
type SnippetResponse = ServiceResponse<SnippetDTO>
// = { snippet: SnippetDTO }
```

### Mapper Pattern

DTOs (Data Transfer Objects) transform entities before sending to client:

```typescript
class SnippetMapper {
  static toDTO(snippet: Snippets, requesterId?: string): SnippetDTO {
    return {
      snippetId: snippet.snippetId,
      shortId: snippet.shortId,
      name: snippet.name,
      description: snippet.description,
      // ... other fields
      owner: {
        auth0Id: snippet.user?.auth0Id,
        userName: snippet.user?.userName,
        displayName: snippet.user?.displayName
      },
      isMine: snippet.auth0Id === requesterId,
      snippetFiles: snippet.snippetFiles || []
    }
  }
}
```

**Purpose:**
- Hide internal IDs
- Reduce payload size
- Add computed fields (isMine)
- Format data for frontend

---

## Request/Response Flow

### Creating a Snippet

```
1. Frontend sends POST /api/v1/snippets
   {
     name: "My Code",
     description: "...",
     snippetFiles: [...]
   }

2. Express receives request
   ├── auth0Check middleware validates JWT
   ├── Attaches req.auth.payload.sub (Auth0 ID)
   └── Passes to route handler

3. SnippetController.createSnippet()
   ├── validateCreateSnippet(req.body)
   │   └── Checks required fields, types, etc.
   │       Throws CustomError if invalid
   └── Calls createSnippetHandler(req)

4. SnippetService.createSnippetHandler()
   ├── Extract auth0Id from req.auth
   ├── executeInTransaction(async (t) => {
   │   ├── createSnippet() → repo call
   │   ├── createSnippetFiles() → repo call
   │   └── Return new snippet with files
   │ }, 'createSnippet')
   ├── Map entity to DTO
   └── Return { snippet: SnippetDTO }

5. SnippetController sends response
   res.status(201).json({
     success: true,
     snippet: SnippetDTO
   })

6. Frontend receives and parses response
```

### Updating a Snippet

```
1. Frontend sends PUT /api/v1/snippets/:shortId
   {
     name: "Updated Name",
     snippetFiles: [
       { fileType: "html", content: "..." }
     ]
   }

2. auth0Check middleware validates token → req.auth.payload.sub

3. SnippetController.updateSnippet()
   ├── validateUpdateSnippet(req.body)
   └── Calls updateSnippetHandler(req)

4. SnippetService.updateSnippetHandler()
   ├── Extract auth0Id, shortId
   ├── Get current snippet by shortId
   ├── Check authorization
   │   └── if (snippet.auth0Id !== auth0Id) throw 403
   ├── Filter protected fields
   │   └── Remove: snippetId, auth0Id, shortId, parentShortId
   ├── executeInTransaction(async (t) => {
   │   ├── updateSnippet() for metadata
   │   ├── updateSnippetFiles() for each file
   │   └── Load updated snippet
   │ }, 'updateSnippet')
   ├── Map to DTO
   └── Return { snippet: SnippetDTO }

5. SnippetController sends 200 OK with updated snippet

6. Frontend updates its store, refreshes preview
```

---

## Best Practices

### 1. Always Validate Input

```typescript
// Use dedicated validator functions
export function validateCreateSnippet(body: any) {
  if (!body.name || typeof body.name !== 'string') {
    throw new CustomError('Name is required and must be string', 400)
  }
  if (body.name.length > 255) {
    throw new CustomError('Name too long', 400)
  }
}
```

### 2. Check Authorization Before Operations

```typescript
const snippet = await findBySnippetId(snippetId)
if (!snippet) throw new CustomError('Not found', 404)

// Owner-only operation
if (snippet.auth0Id !== auth0Id) {
  throw new CustomError('Unauthorized', 401)
}

// Proceed with operation
```

### 3. Use Transactions for Multi-Step Operations

```typescript
// Bad: independent calls, can leave DB in bad state
await createSnippet(data)
await createSnippetFiles(files)  // If this fails, orphaned snippet

// Good: atomic transaction
return await executeInTransaction(async (t) => {
  const snippet = await createSnippet(data, t)
  await createSnippetFiles(files, t)
  return snippet
}, 'operationName')
```

### 4. Map Entities to DTOs Before Returning

```typescript
// Bad: returning raw entity
return { snippet }  // Exposes internal structure

// Good: map to clean DTO
return { snippet: SnippetMapper.toDTO(snippet, auth0Id) }
```

### 5. Log Errors for Debugging

```typescript
// Bad: silent failure
if (!found) return null

// Good: log and throw
if (!found) {
  logger.error('Snippet not found:', snippetId)
  throw new CustomError('Not found', 404)
}
```

### 6. Use Descriptive Error Messages

```typescript
// Bad: generic error
throw new CustomError('Error', 500)

// Good: specific, actionable error
throw new CustomError('ShortId generation failed - try again', 500)
throw new CustomError('You can only edit your own snippets', 403)
```

### 7. Eager Load Related Data

```typescript
// Bad: N+1 query problem
const snippets = await findAllSnippets()
for (const s of snippets) {
  const files = await findSnippetFiles(s.snippetId)  // Query per snippet
}

// Good: eager load
const snippets = await Snippets.findAll({
  include: [SnippetFiles, Users]  // Load all in one query
})
```

### 8. Use Indexes on Frequently Queried Columns

```typescript
// In entity definition
@Table({
  indexes: [
    { fields: ['auth0_id'] },        // Find user's snippets
    { fields: ['short_id'] },        // URL lookups
    { fields: ['is_private', 'created_at'] }  // Public feed
  ]
})
```

---

## Debugging Tips

### 1. Enable SQL Logging

In `sequelize.ts`:
```typescript
const sequelize = new Sequelize({
  // ... config
  logging: (sql) => logger.debug(`[SQL] ${sql}`)
})
```

View logs to see actual queries being executed.

### 2. Check Auth0 Token

```typescript
// Log decoded token in auth0Check middleware
const decoded = jwt.decode(token)
console.log('Decoded token:', decoded)
```

### 3. Trace Authorization Failures

```typescript
const snippet = await findBySnippetId(snippetId)
console.log('Snippet owner:', snippet.auth0Id)
console.log('Request user:', auth0Id)
console.log('Match:', snippet.auth0Id === auth0Id)
```

### 4. Check Database Connection

```bash
# In terminal
docker-compose logs db  # View MySQL logs

# Or test manually
mysql -h localhost -u user -p database_name
> SHOW TABLES;
> SELECT * FROM snippets LIMIT 1;
```

### 5. Validate Request Format

Add logging in controller:
```typescript
console.log('Received request:', {
  body: req.body,
  params: req.params,
  auth: req.auth
})
```

### 6. Check Rate Limiter

If getting 429 Too Many Requests:
```typescript
// Check configuration
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // 100 requests per window
})
```

### 7. Inspect Error Stack Traces

Errors are logged at debug level:
```bash
# In docker logs
docker-compose logs backend | grep "stack"

# Or check log files
tail -f logs/debug.log
```

### 8. Test Endpoints with Curl

```bash
# Create snippet
curl -X POST http://localhost:3000/api/v1/snippets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test",...}'

# Get snippet
curl http://localhost:3000/api/v1/snippets/shortId

# Check response status
curl -i http://localhost:3000/api/v1/snippets/invalid
```

---

## Summary

The Snippy backend is organized into clear layers:

1. **Middleware** - Cross-cutting concerns (auth, logging, errors)
2. **Controllers** - HTTP interface, validation, response formatting
3. **Services** - Business logic, transactions, authorization
4. **Repositories** - Database access, queries
5. **Entities** - Data model, relationships

**Key Principles:**
- Always validate input
- Always authorize before operations
- Use transactions for multi-step operations
- Map entities to DTOs before responding
- Log errors with context
- Handle errors consistently

**Common Patterns:**
- Service handler takes `ServicePayload`, returns `ServiceResponse<T>`
- Repositories support optional `transaction` parameter
- All errors are mapped to `CustomError` for consistent handling
- DTOs hide internal structure and add computed fields
- Authorization checks happen in service, not middleware

This structure keeps concerns separated, makes code testable, and ensures reliable data operations.
