# Snippy Frontend Architecture & Flow

Developer guide for the Angular SPA in [`snippy/frontend`](../snippy/frontend). Paths below use the **current flat layout** under `src/app/` (there is no longer a `shared/` or `core/` tree).

## Table of contents

1. [Overview](#overview)
2. [Project setup](#project-setup)
3. [Folder structure](#folder-structure)
4. [App shell & header modes](#app-shell--header-modes)
5. [Routing](#routing)
6. [Authentication flow](#authentication-flow)
7. [State management (signals)](#state-management-signals)
8. [API layer](#api-layer)
9. [UI services](#ui-services)
10. [Pages & data flows](#pages--data-flows)
11. [Snippet editing flow](#snippet-editing-flow)
12. [Editor preferences & themes](#editor-preferences--themes)
13. [Embed player](#embed-player)
14. [Preview system](#preview-system)
15. [Save, dirty tracking & navigation](#save-dirty-tracking--navigation)
16. [Lists, feeds & pagination](#lists-feeds--pagination)
17. [Dialogs](#dialogs)
18. [Styles & design system](#styles--design-system)
19. [Key interfaces](#key-interfaces)
20. [End-to-end data flow](#end-to-end-data-flow)
21. [Common gotchas](#common-gotchas)
22. [Related docs](#related-docs)

---

## Overview

Snippy’s frontend is an **Angular 22** standalone SPA that uses **signals** for domain state, **Auth0** for login, **Angular Material** for interactive chrome, and **Tailwind CSS v4** for layout utilities on top of a dark glass design system.

Users can create, edit, preview, share, favorite, comment on, fork, and organize HTML/CSS/JS snippets. Marketing, legal, feed, profile, settings, editor, guest try, embed player, and full-page preview surfaces share one shell (`app-page-header` + `router-outlet` + `app-footer`); embed mode hides chrome.

**Key packages** (see [`package.json`](../snippy/frontend/package.json), currently `0.8.6`):

| Area | Packages |
|------|----------|
| Framework | `@angular/*` ^22 |
| Auth | `@auth0/auth0-angular` |
| UI | `@angular/material`, `@angular/cdk` |
| Editor | `codemirror`, `@codemirror/lang-*`, `theme-one-dark`, `angular-split` |
| Export | `jszip` |
| Resilience | `cockatiel` (retry + circuit breaker on HTTP) |
| Styling | `tailwindcss` ^4 + Material M3 theme (violet / cyan, dark) |

**Path alias:** `@app/*` → `src/app/*` (`tsconfig.json`).

---

## Project setup

### Bootstrap

```
index.html
  └── loads /env.js          (runtime config; written by Docker entrypoints)
  └── boots main.ts
        └── bootstrapApplication(AppComponent, appConfig)
```

- [`src/main.ts`](../snippy/frontend/src/main.ts) — application entry
- [`src/app/app.config.ts`](../snippy/frontend/src/app/app.config.ts) — zone, router, animations, HttpClient + `AuthHttpInterceptor`, `provideAuth0`, `provideDialogDefaults()`
- [`src/app/app.component.ts`](../snippy/frontend/src/app/app.component.ts) — shell; injects `AuthStoreService` so Auth0→backend sync starts at bootstrap

### Runtime configuration (`/env.js`)

Do **not** bake Auth0 tenants into build-time `environment.ts`. The same image must run under different domains.

Container entrypoints write env before the app starts:

| Mode | Entrypoint | Output |
|------|------------|--------|
| Dev Compose | `entrypoint.dev.sh` | `public/env.js` |
| Prod image | `entrypoint.sh` | `/usr/share/nginx/html/env.js` |

Typed access: [`src/app/config/runtime-env.ts`](../snippy/frontend/src/app/config/runtime-env.ts) via `getRuntimeEnv()` / `assertAuth0Env()`.

| Field | Used for |
|-------|----------|
| `api_base` | `ApiService` base path (default `/api/v1`) |
| `auth0_domain` / `auth0_client_id` | `provideAuth0` |
| `auth0_audience` | Auth0 API audience (default `http://localhost:3000`) |
| `minio_enabled` | Assets dialog / nginx MinIO proxy path |

Auth0 redirect after login: `window.location.origin + '/home'`.

### Proxies

| Context | `/api` | `/content` |
|---------|--------|------------|
| Dev (`proxy.conf.json` + `ng serve`) | → `api:3000` | → `minio:9000` |
| Prod (`nginx.nominio.conf` / `nginx.minio.conf`) | → `api:3000` | → `minio:9000` when MinIO is healthy |

Public traffic should hit the **frontend** origin only. The browser uses same-origin `api_base`; nginx (or the Angular proxy in dev) forwards to the API.

---

## Folder structure

```text
src/app/
├── app.component.* / app.config.ts / app.routes.ts
├── components/
│   ├── async-state/
│   ├── dialogs/            # alert, confirm, assets, comments, settings,
│   │                       # collections, embed
│   ├── editor/             # snippet-editor (CodeMirror), snippet-preview (iframe)
│   ├── embed/              # embed-player, embed-code-pane
│   ├── footer/
│   ├── headers/            # page-header, sort-page-header
│   ├── lists/              # snippet-list, collection-list, external-resources-list
│   ├── modules/            # user-menu, user-identity-header
│   └── ui/                 # list-toolbar, list-paginator, list-empty-state,
│                           # fork-attribution, snippet-stat-bar
├── config/                 # runtime-env.ts
├── editor/                 # preferences types, service, CodeMirror factory, themes/
├── guards/                 # unsaved-changes.guard.ts
├── interfaces/
├── pages/                  # home, user-home, feeds, profile, settings,
│                           # collection-detail, snippet-web-view, fullpage-view,
│                           # embed-player-page, privacy-policy, terms
├── services/
│   ├── api/                # HTTP wrappers + resilience
│   ├── stores/             # auth, snippet, collection (signal stores)
│   └── ui/                 # dialog, snackbar, navigation, editor-ui,
│                           # follow-ui, snippet-actions, snippet-save-ui
└── utils/                  # list-page-state.ts
```

Styles live in [`src/styles.scss`](../snippy/frontend/src/styles.scss) plus partials under [`src/styles/`](../snippy/frontend/src/styles/).

---

## App shell & header modes

[`app.component.html`](../snippy/frontend/src/app/app.component.html) layout:

1. Atmosphere (orbs / grid)
2. `app-page-header`
3. `<main><router-outlet></main>`
4. `app-footer`

### Header modes

Type: [`HeaderMode`](../snippy/frontend/src/app/interfaces/header-mode.ts) = `'landing' | 'feed' | 'editor' | 'minimal' | 'embed'`.

Set via route `data.header`. [`PageHeaderComponent`](../snippy/frontend/src/app/components/headers/page-header/page-header.component.ts) reads the deepest activated route (with a URL fallback).

| Mode | Chrome |
|------|--------|
| `landing` | Brand + Log in |
| `feed` | Brand, nav pills (Your Snippets / Following / Public), user menu |
| `editor` | Name field (owner/new), stat bar, save, layout menu, settings, user menu |
| `minimal` | Brand + user menu (full-page preview) |
| `embed` | Shell hides header/footer; player provides its own bar |

### Footer

[`FooterComponent`](../snippy/frontend/src/app/components/footer/footer.component.ts):

- If `snippetStore.snippet()?.snippetId` → **Fork / Export ZIP / Assets**
- Else → copyright + **Privacy Policy / Terms / License / GitHub**

New unsaved pens (no `snippetId` yet) still show the legal footer until the first successful save.

---

## Routing

Defined in [`app.routes.ts`](../snippy/frontend/src/app/app.routes.ts). Most routes lazy-load; only `''` (marketing home) is eager.

| Path | Page | Guards | `data.header` | Notes |
|------|------|--------|---------------|-------|
| `''` | HomePage | — | `landing` | Auto-navigates to `/home` if Auth0 session exists |
| `privacy` | PrivacyPolicy | — | `landing` | Public legal |
| `terms` | Terms | — | `landing` | Public legal |
| `home` | UserHome | AuthGuard | `feed` | Snippets / Collections / Favorites / Projects tabs |
| `following` | SnippetFeed | AuthGuard | `feed`, `feed: 'following'` | |
| `public` | SnippetFeed | AuthGuard | `feed`, `feed: 'public'` | |
| `settings` | Settings | AuthGuard | `feed` | Tabs: Profile, Editor, Account |
| `collections/:shortId` | CollectionDetail | AuthGuard | `feed` | |
| `embed/:shortId` | EmbedPlayerPage | — | `embed` | Public embed iframe player |
| `try` | SnippetWebView | unsavedChanges | `editor`, `guest: true` | Guest editor (defaults prefs) |
| `snippet` | SnippetWebView | AuthGuard + unsavedChanges | `editor` | New pen |
| `:username/snippet/:id` | SnippetWebView | AuthGuard + unsavedChanges | `editor` | Existing pen (`id` = **shortId**) |
| `:username/fullpage/:id` | FullpageView | AuthGuard | `minimal` | Preview only |
| `:username` | Profile | AuthGuard | `feed` | Catch-all username |
| `**` | → `''` | | | |

**Ordering matter:** `privacy` and `terms` are registered **before** `:username`. If they were after the catch-all, `/privacy` would load as a profile named `privacy`. Same for `try` / `embed` / `snippet` — they must stay before the username catch-all.

### Guards

1. **AuthGuard** (Auth0 SDK) — requires an Auth0 session. Does **not** wait for backend `AuthStoreService.user()`.
2. **`unsavedChangesGuard`** — if `SnippetStoreService.isDirty()`, opens a confirm dialog; Leave vs Stay.

---

## Authentication flow

```text
Auth0 loginWithRedirect
  → redirect_uri = origin + '/home'
  → AuthHttpInterceptor attaches Bearer to /api/* and /api/v1/*
  → AuthStoreService watches isAuthenticated$
       → user$ (Auth0 profile)
       → POST /users (AuthAPIService.syncBackendUser)
       → user signal = backend User
```

### `AuthStoreService` ([`services/stores/auth.store.service.ts`](../snippy/frontend/src/app/services/stores/auth.store.service.ts))

| Member | Kind | Meaning |
|--------|------|---------|
| `user` | `signal<User \| null>` | Backend profile (null until sync succeeds); includes `editorPreferences` when present |
| `isAuthenticated` | `computed` | `!!user()` — **backend** user present |
| `syncing` | `signal<boolean>` | Auth0→backend sync in flight |
| `patchUser` | method | Merge fields after settings save |
| `setUserFromApi` | method | Replace cached user (also used after editor prefs / privacy save) |
| `logout` | method | Clear store + Auth0 `returnTo: origin` |
| `refreshUserFromBackend` | method | `GET /users/me` |

**Critical:** Auth0 `AuthGuard` can activate a route before `user()` is set. Anything that needs `userName`, ownership, or API identity must wait on `AuthStoreService.user()` / `isAuthenticated`, not Auth0 alone.

Editor preferences ride along on `POST /users` (ensure) and `GET /users/me` / `PUT /users` responses — no separate preferences endpoint. After login sync, `EditorPreferencesService` reads them from `AuthStore.user`.

Login entry points: landing header, home CTA. Logout: user menu (confirms if editor is dirty).

---

## State management (signals)

Domain state lives in three root-provided **store services**. UI chrome layout has a small fourth signal store (`EditorUiService`). Prefer updating stores; presentational components read signals and emit events.

### Mental model

```text
Page / header / list action
  → UI service (optional) or store method
  → API service (HttpClient + Auth interceptor + cockatiel)
  → store signals updated
  → templates / effects re-run
```

Stale-response protection: list/detail loaders bump generation counters (`listGeneration`, `favoritesGeneration`, `detailGeneration`, collection equivalents) and ignore outdated responses.

---

### `SnippetStoreService`

Path: [`services/stores/snippet.store.service.ts`](../snippy/frontend/src/app/services/stores/snippet.store.service.ts)

Central hub for the open pen, list pages, favorites, dirty tracking, and preview invalidation.

#### Signals

| Signal | Type | Role |
|--------|------|------|
| `snippet` | `Snippet \| null` | Active editor / fullpage pen |
| `originalSnippet` | private `Snippet \| null` | Deep-cloned baseline for dirty checks |
| `snippetList` | `SnippetListResponse \| null` | Public / feed / mine / profile list payload |
| `favoritesList` | `SnippetListResponse \| null` | Favorites tab payload |
| `previewUpdateType` | `string \| null` | `'full'` \| `'partial'` \| `null` |
| `loading` | `boolean` | Primary list/detail loading |
| `favoritesLoading` | `boolean` | Favorites-specific loading |
| `error` | `string \| null` | Last error message |
| `isDirty` | **computed** | Compares `snippet` vs `originalSnippet` |

`isDirty` watches: `name`, `description`, `isPrivate`, `tags`, `externalResources` (type + url), and each `snippetFiles[].content`.

#### Loaders

| Method | API | Writes |
|--------|-----|--------|
| `loadSnippet(shortId)` | `GET /snippets/:shortId` | `snippet` + `originalSnippet` via `setSnippet(..., true)` |
| `loadUserSnippets` | `GET /snippets/me` | `snippetList` |
| `loadPublicSnippets` | `GET /snippets/public` | `snippetList` |
| `loadFeedSnippets` | `GET /snippets/feed` | `snippetList` |
| `loadUserPublicSnippets` | `GET /snippets/user/:userName` | `snippetList` |
| `loadFavorites` | `GET /favorites` | `favoritesList` |
| `searchSnippets` | search endpoint | `snippetList` |

#### Mutations

| Method | Behavior |
|--------|----------|
| `setSnippet(s, updatePreview?)` | Sets `snippet` + deep-clones into `originalSnippet`; optionally `'full'` preview |
| `updateSnippetFile(type, content)` | Patches file; html/js → `'full'`, css → `'partial'` |
| `updateSnippetName` | Updates name; `'full'` preview |
| `updateSnippetSettings` | description / privacy / tags / externalResources; `'full'` |
| `updateSnippetCounts` / `patchSnippetCounts` | Fork/view/comment/favorite counts on detail + lists |
| `bumpCommentCount` | ± commentCount on detail + both lists |
| `saveSnippet` | POST (new) or PUT (existing `snippetId`); refreshes baseline |
| `deleteSnippet` | DELETE + list cleanup |
| `favoriteSnippet` | Toggle favorite; optimistic list/detail updates |
| `forkSnippet` | POST fork; bumps forkCount on current if matching |
| `recordView` | Non-blocking view count |
| `clearSnippet` | Nulls open pen (call on editor/fullpage destroy) |

**Ownership rule:** Editor and fullpage views call `clearSnippet()` on destroy so list pages do not keep a stale open pen in the store.

#### Who consumes it

Editor / fullpage pages, feed / home / profile lists, page header, footer, `SnippetActionsService`, `SnippetSaveUIService`, `unsavedChangesGuard`, comment dialog, snippet editor, user menu (dirty logout).

---

### `CollectionStoreService`

Path: [`services/stores/collection.store.service.ts`](../snippy/frontend/src/app/services/stores/collection.store.service.ts)

| Signal | Role |
|--------|------|
| `collections` | Current list page |
| `totalCount` | Server total |
| `loading` / `error` | Status |
| `activeCollection` | Detail page collection (may embed snippets) |

| Method | Role |
|--------|------|
| `loadMine` | Current user’s collections (`snippetId` optional for “contains” flags) |
| `loadUser` | Public collections for a profile |
| `loadOne` | Detail by `shortId` (+ optional search `q`) |
| `create` / `delete` | CRUD |
| `addSnippet` / `removeSnippet` | Membership |

Consumers: user-home, profile, collection-detail, create / add-to-collection dialogs.

---

### `EditorUiService`

Path: [`services/ui/editor-ui.service.ts`](../snippy/frontend/src/app/services/ui/editor-ui.service.ts)

| Signal | Role |
|--------|------|
| `layout` | `'top' \| 'bottom' \| 'left' \| 'right'` — persisted as `localStorage.editorLayout` |

`setLayout` updates the signal and storage. Page header toggles layout; snippet web-view remounts split + preview when it changes.

---

## API layer

### `ApiService`

Path: [`services/api/api.service.ts`](../snippy/frontend/src/app/services/api/api.service.ts)

- Base URL from `getRuntimeEnv().api_base`
- `request({ path, method, body, params, headers })` → HttpClient
- Wrapped in cockatiel policy ([`resilience.service.ts`](../snippy/frontend/src/app/services/api/resilience.service.ts)): retry on 5xx/network, circuit breaker
- **Does not** attach Authorization — Auth0 `AuthHttpInterceptor` does for `/api/*` and `/api/v1/*`

### Endpoint map

| Service | Responsibilities |
|---------|------------------|
| **AuthAPIService** | `POST /users` (sync), `GET /users/me` |
| **UserApiService** | `GET /users/:userName`, `PUT /users`, `GET /users/check-username/:userName`, `DELETE /users` |
| **SnippetAPIService** | Load/create/update/fork/view/delete/search; me / public / feed / user lists |
| **FavoriteService** | `POST /favorites/:snippetId`, `GET /favorites` |
| **CommentService** | CRUD under `/comments/...` |
| **FollowApiService** | `POST` / `DELETE /users/:userName/follow` |
| **CollectionApiService** | me / user / one; create/delete; add/remove snippets |
| **ResourceApiService** | List/upload/delete assets (`POST` uses multipart `FormData`, bypasses generic JSON helper) |

---

## UI services

| Service | Role |
|---------|------|
| **DialogService** | Opens Material dialogs with size presets `sm`–`xl`, always merges `panelClass: snippy-dialog`, `maxHeight: 85vh`. Helpers: `confirm`, `confirmAndRun`, `alert` / typed variants. `provideDialogDefaults()` sets global MAT defaults. |
| **SnackbarService** | Typed snackbars (success / error / …), bottom-end |
| **NavigationService** | Canonical URLs: home, settings, new snippet, profile, snippet, parent fork, collection, `fullPageUrl` |
| **SnippetActionsService** | Fork-and-open, open comments, add-to-collection, optimistic favorite, store favorite, delete-with-confirm |
| **SnippetSaveUIService** | Save if dirty → snackbar → for new pens navigate to `/:userName/snippet/:shortId` |
| **FollowUiService** | Follow / unfollow + snackbar; returns updated `isFollowing` |
| **EditorUiService** | Editor layout signal (above) |

Prefer these services from lists, header, and footer so behavior stays consistent.

---

## Pages & data flows

| Page | Route | Data flow |
|------|-------|-----------|
| **Home** | `''` | Marketing + capabilities; Auth0 login; if authenticated → `/home` |
| **User home** | `/home` | Tabs: `loadUserSnippets`, `loadMine` collections, `loadFavorites`; each owns a `ListPageState`; create collection dialog; Projects = coming soon |
| **Snippet feed** | `/public`, `/following` | Same page; `data.feed` selects `loadPublicSnippets` vs `loadFeedSnippets`; sort via `SortPageHeaderComponent` |
| **Profile** | `/:username` | `UserApiService.getByUserName` → local profile signal; public pens + collections; follow via `FollowUiService` |
| **Settings** | `/settings` | Hydrate from `AuthStore.user`. **Profile** (display name, bio); **Editor** (live CodeMirror preview + prefs → `PUT /users`); **Account** (username, privacy toggle, delete → confirm → logout) |
| **Collection detail** | `/collections/:shortId` | `loadOne`; search reloads API; client-side page slice of embedded snippets; owner can remove |
| **Snippet web view** | `/snippet`, `/:user/snippet/:id` | Load or blank template; CodeMirror + preview; Ctrl+S; clear store on destroy |
| **Try (guest)** | `/try` | Same editor UI without AuthGuard; prefs = defaults until login |
| **Embed player** | `/embed/:shortId` | Public iframe player; query params for tabs / editable / theme |
| **Fullpage view** | `/:user/fullpage/:id` | Preview only; record view if not owner; clear on destroy |
| **Privacy / Terms** | `/privacy`, `/terms` | Static legal; landing header; linked from footer |

---

## Snippet editing flow

```text
/snippet  or  /:username/snippet/:shortId
  → SnippetWebViewComponent
       → loadSnippet(shortId)  OR  blank untitled template (isOwner: true)
       → setSnippet(..., true) → previewUpdateType = 'full'
       → as-split: SnippetEditorComponent | SnippetPreviewComponent
```

### Editing

1. CodeMirror docs sync from `snippet()` files.
2. On change → `updateSnippetFile(fileType, content)`:
   - `html` / `js` → `previewUpdateType = 'full'`
   - `css` → `'partial'`
3. Name field (header, owners) → `updateSnippetName`.
4. Settings dialog (owners) → on save result → `updateSnippetSettings` + `SnippetSaveUIService.saveSnippetWithUI`.

Editors apply user prefs from [`EditorPreferencesService`](../snippy/frontend/src/app/editor/editor-preferences.service.ts) via a CodeMirror `Compartment` (see [Editor preferences & themes](#editor-preferences--themes)).

### Settings dialog

Opened from editor header with `DialogService.open(..., 'xl', { minHeight: '50vh', panelClass: 'snippy-dialog-tall' })`.

Tabs:

- **General** — description, private/public toggle, tags
- **CSS** — `ExternalResourcesListComponent` (`resourceType: 'css'`)
- **JS** — same for scripts

Tall dialog CSS grows to a capped height, scrolls content, pins Cancel/Save, and hides inactive Material tab bodies so height follows the active tab only.

### Other editor actions

| Action | Where | Behavior |
|--------|-------|----------|
| Save | Header / Ctrl+S | `SnippetSaveUIService` |
| Layout | Header menu | `EditorUiService.setLayout` |
| Fork | Header / footer / lists | `SnippetActionsService.forkAndOpen` |
| Comments | Stat bar / lists | `CommentDialogComponent` |
| Favorite | Stat bar / lists | Optimistic + `favoriteSnippet` |
| Assets | Footer / user menu | `AssetsDialogComponent` (MinIO / `minio_enabled`) |
| Export ZIP | Footer | JSZip: full HTML shell + `style.css` / `script.js` + external resources |
| Embed | Footer / actions | `EmbedDialogComponent` — iframe URL with tabs, editable, theme |
| Account editor prefs | `/settings` → Editor | Persisted on user; applied to all CodeMirror panes |
| Views | Effect in web-view / fullpage | One `recordView` per navigation for non-owners |

---

## Editor preferences & themes

User CodeMirror preferences are stored as JSON on the **user** row (`editorPreferences`), loaded with login, and applied in the snippet editor, embed code pane, and Settings live preview.

### Shape and defaults

Defined in [`editor/editor-preferences.ts`](../snippy/frontend/src/app/editor/editor-preferences.ts):

| Preference | Default |
|------------|---------|
| `fontSize` | `15` (allowed 10–24) |
| `fontFamily` | `monospace` (`fira-code`, `jetbrains-mono`, `source-code-pro`) |
| `indentWith` / `indentWidth` | `spaces` / `2` (width 1–8) |
| `lineNumbers`, `lineWrapping`, `codeFolding`, `autocomplete`, `matchBrackets` | `true` |
| `theme` | `one-dark` (also `dracula`, `light`) |

`mergeEditorPreferences(stored)` always returns a full object (defaults fill missing keys). Guests and `/try` never have account prefs — they use defaults until login.

### `EditorPreferencesService`

[`editor/editor-preferences.service.ts`](../snippy/frontend/src/app/editor/editor-preferences.service.ts)

| Member | Role |
|--------|------|
| `preferences` | Computed: local override → `AuthStore.user.editorPreferences` → defaults |
| `applyLocal` | Settings page live preview before save |
| `clearLocal` | Discard unsaved preview override |
| `snapshot` | Copy of effective prefs |

### CodeMirror wiring

[`editor/codemirror-extensions.ts`](../snippy/frontend/src/app/editor/codemirror-extensions.ts):

- `baseEditorExtensions()` — history, selection, keymaps, etc.
- `buildPreferenceExtensions(prefs)` — theme, font, indent, line numbers, wrapping, folding, brackets, autocomplete

Editors hold a `Compartment` and reconfigure when `preferences()` changes:

- [`snippet-editor`](../snippy/frontend/src/app/components/editor/snippet-editor/)
- [`embed-code-pane`](../snippy/frontend/src/app/components/embed/embed-code-pane/) (optional `@Input() theme` overrides URL theme)
- Settings Editor tab preview

Device layout (`EditorUiService` / `localStorage.editorLayout`) is separate and not synced to the server.

### Settings → Editor tab

Live HTML/CSS/JS sample preview, theme radios (dark/light groups), font family + size, indent, option checkboxes. Save calls `UserApiService.updateProfile({ editorPreferences })` → `AuthStore.setUserFromApi` → editors update.

### How to add a theme

Keep frontend and backend allowlists in sync.

1. **Define the extension** in [`editor/themes/index.ts`](../snippy/frontend/src/app/editor/themes/index.ts) — import an npm CodeMirror theme (like `oneDark`) or build one with `EditorView.theme({ ... }, { dark: true|false })`.
2. **Register it** in `EDITOR_THEMES` with `{ key, label, group: 'dark'|'light', extension }`.
3. **Allowlist the key** in:
   - Frontend [`EDITOR_THEME_KEYS`](../snippy/frontend/src/app/editor/editor-preferences.ts)
   - Backend [`EDITOR_THEME_KEYS`](../snippy/backend/src/common/utilities/editor-preferences.ts) (Joi for `PUT /users`)
4. Settings radios and the embed dialog theme dropdown pick it up from `EDITOR_THEMES` / keys automatically. `getThemeExtension()` falls back to `one-dark` for unknown keys.

Optional: load web fonts in [`index.html`](../snippy/frontend/src/index.html) if the theme or font family needs them (Fira Code / JetBrains Mono / Source Code Pro are already linked).

---

## Embed player

Public route [`/embed/:shortId`](../snippy/frontend/src/app/pages/embed-player-page/) hosts [`EmbedPlayerComponent`](../snippy/frontend/src/app/components/embed/embed-player/). Only **public** saved snippets can be embedded.

### Query parameters

| Param | Example | Behavior |
|-------|---------|----------|
| `default-tab` | `html,css,result` | Comma-separated tabs to show (`html`, `css`, `js`, `result`) |
| `editable` | `true` | Local-only edits in the code pane (not saved) |
| `theme` | `dracula` | CodeMirror theme override; must be in `EDITOR_THEME_KEYS`; invalid → ignored (viewer prefs / defaults apply) |

Example:

```text
/embed/{shortId}?default-tab=html,result&editable=false&theme=dracula
```

### Embed dialog

[`EmbedDialogComponent`](../snippy/frontend/src/app/components/dialogs/embed-dialog/) builds the iframe URL (tabs, editable, theme select defaulting to the user’s saved theme or `one-dark`) and copyable HTML. Preview iframe uses the same URL.

Theme is **URL-only** (same as `editable`) — not stored on the snippet.

---

## Preview system

[`SnippetWebViewComponent`](../snippy/frontend/src/app/pages/snippet-web-view/snippet-web-view.component.ts) runs an **effect** on:

- `snippetStore.snippet()`
- `snippetStore.previewUpdateType()`
- `editorUi.layout()` (forces remount when split orientation changes)

It resolves html/css/js files + `externalResources` and calls [`SnippetPreviewComponent.updatePreview`](../snippy/frontend/src/app/components/editor/snippet-preview/snippet-preview.component.ts):

| `previewUpdateType` | Behavior |
|---------------------|----------|
| `'partial'` | Mutate `#snippet-style` inside the existing iframe (CSS-only fast path) |
| `'full'` (or anything else non-null) | Rebuild `iframe.srcdoc` with external CSS `<link>`s, HTML, inline CSS, external JS `<script>`s, inline JS |

After applying, clear or leave `previewUpdateType` as the preview component documents (avoid infinite loops by only setting the signal when content actually changes upstream).

**Race note:** A `'partial'` update can no-op if the iframe `contentDocument` is not ready yet after a full reload. A subsequent `'full'` or another edit recovers.

Fullpage view uses the same preview component without the CodeMirror split.

---

## Save, dirty tracking & navigation

```text
User edits store fields
  → isDirty computed becomes true
  → Save / Ctrl+S
       → SnippetSaveUIService.saveSnippetWithUI
            → store.saveSnippet (POST or PUT)
            → originalSnippet refreshed (isDirty → false)
            → snackbar success
            → if new: navigate to /:userName/snippet/:shortId
```

Leaving the editor with dirty state:

- Router `unsavedChangesGuard` → confirm dialog
- User menu logout also checks `isDirty()` and confirms

**Do not** call `setSnippet` on every keystroke — that resets `originalSnippet` and breaks dirty tracking. Use `updateSnippetFile` / `updateSnippetName` / `updateSnippetSettings`.

**ID confusion:** Routes and `loadSnippet` use **`shortId`**. Persist/update uses **`snippetId`** (UUID) on PUT.

---

## Lists, feeds & pagination

### `ListPageState`

Path: [`utils/list-page-state.ts`](../snippy/frontend/src/app/utils/list-page-state.ts)

One instance per list surface (page or tab). Default `pageSize` = **6**.

| API | Behavior |
|-----|----------|
| `page` | 1-based page for the backend |
| `query` | Trimmed search or `undefined` |
| `onSearch` | Reset to page 0 + reload |
| `onSortChange` | Reset page + reload |
| `onPageChange` | Update page + reload |
| `setPage` | Page only (client-side paging, e.g. collection detail) |
| `reload` | Invoke the injected loader |

### Presentational pieces

- **`SnippetListComponent`** — cards, toolbar, empty state, paginator; wires navigation + `SnippetActionsService` + follow
- **`CollectionListComponent`** — same pattern; create / open / delete outputs
- **`ListToolbarComponent`** — search submits on Enter
- **`ListPaginatorComponent`** / **`ListEmptyStateComponent`**
- **`SnippetStatBarComponent`** — comment / favorite / fork / views
- **`ForkAttributionComponent`** — parent pen credit
- **`AsyncStateComponent`** — loading wrapper used by pages

### Feeds

[`SnippetFeedPageComponent`](../snippy/frontend/src/app/pages/snippet-feed-page/snippet-feed-page.component.ts) is shared:

- `data.feed === 'public'` → Explore / `loadPublicSnippets`
- `data.feed === 'following'` → Following / `loadFeedSnippets`

Sort options come from `SnippetSort` on the snippet API service.

---

## Dialogs

Always open through **`DialogService`** so `snippy-dialog` + max-height apply.

| Dialog | Trigger |
|--------|---------|
| **ConfirmDialog** | `confirm` / `confirmAndRun` — unsaved leave, deletes, dirty logout, remove from collection |
| **AlertDialog** | Typed alerts (e.g. invalid external URLs in settings) |
| **EmbedDialog** | Footer embed action — iframe URL (tabs, editable, theme) |
| **SnippetSettingsDialog** | Editor settings (`snippy-dialog-tall`) |
| **AssetsDialog** | Footer / user menu (MinIO gated) |
| **CommentDialog** | Stat bar / list comment action |
| **AddToCollectionDialog** | List “add to collection”; loads mine with `snippetId` for `containsSnippet` |
| **CollectionCreateDialog** | User-home create; can nest from add-to-collection |

Dialog chrome: dark frosted glass, shared form tokens, explicit `<mat-divider>` above actions (not a CSS border on `mat-dialog-actions`). Tall/tabbed surfaces use `.snippy-dialog-tall` (see styles).

---

## Styles & design system

Entry: [`src/styles.scss`](../snippy/frontend/src/styles.scss)

1. Material M3 dark theme — violet primary, cyan tertiary, Space Grotesk / IBM Plex Sans
2. `@import 'tailwindcss'`
3. Partials:

| Partial | Concern |
|---------|---------|
| `_tokens.scss` | CSS variables: brand, surfaces, dialog, text, glass, blur, shadows, snackbar |
| `_base` / `_brand-nav` / `_glass` / `_atmosphere` / `_layout` / `_motion` | Global look |
| `_list-card` | Shared list card chrome |
| `_material-*` | Cards, dialogs, chips/menus, forms, tabs, buttons, snackbar, overlays, Tailwind fixes |

Tokens live in `:root` (e.g. `--dialog-surface`, `--text-link`, `--brand-violet`). Prefer variables over hardcoded hex in new UI.

**Dialog layout notes:**

- `.snippy-dialog` — flex column surface; scrollable content; pinned actions
- Global dialog surface `max-height: 85vh`
- `.snippy-dialog-tall` — min/max height for snippet settings (currently capped at **50vh** in CSS); content scrolls; inactive tabs `display: none`

---

## Key interfaces

### `Snippet`

[`interfaces/snippet.interface.ts`](../snippy/frontend/src/app/interfaces/snippet.interface.ts)

Identity: `snippetId?`, `shortId`, `name`, `description`, `tags`, `isPrivate`  
Social: `forkCount`, `viewCount`, `commentCount`, `favoriteCount`, `isFavorited?`  
Graph: `parentShortId`, `parentName?`, `parentUserName?`  
Ownership: `isOwner`, `userName?`, `displayName`  
Payload: `snippetFiles[]`, `externalResources?`

### `SnippetList`

Card row shape (no file bodies): counts + `isFollowing?` for follow UI on feeds/profiles.

### `User`

`userName`, `displayName`, `bio?`, `pictureUrl?`, `isAdmin?`, `isPrivate?`, `editorPreferences?`, `isFollowing?`, `followerCount?`, `followingCount?`, `assets?`

`editorPreferences` is owner-only from the API (merged with defaults). See [`editor/editor-preferences.ts`](../snippy/frontend/src/app/editor/editor-preferences.ts).

### `Collection`

Ids, name, description, `isPrivate`, `isOwner`, `snippetCount?`, `containsSnippet?`, optional embedded `snippets`

Also see: `Comment`, `Assets`, `ExternalResource`, `SnippetFile`, and `*Response` wrappers (`success`, payload fields).

---

## End-to-end data flow

```text
┌─────────────────────────────────────────────────────────────────┐
│ AppComponent                                                    │
│  AuthStoreService sync · PageHeader · RouterOutlet · Footer     │
└─────────────────────────────────────────────────────────────────┘
         │                         │                      │
         ▼                         ▼                      ▼
   Auth0 + POST /users      Route → Page              snippet()?
         │                         │                 Fork/Export/Assets
         ▼                         ▼
   user / isAuthenticated   ListPageState + loaders
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            SnippetStore   CollectionStore   FollowUi / Actions
                    │              │
                    ▼              ▼
              ApiService + AuthHttpInterceptor + cockatiel
                    │
                    ▼
                 Backend /api/v1
```

### Editor signal loop

```text
CodeMirror change
  → updateSnippetFile
  → snippet signal + previewUpdateType
  → effect in SnippetWebView
  → SnippetPreviewComponent (partial CSS or full srcdoc)
  → isDirty computed true
  → Save → POST/PUT → setSnippet baseline → isDirty false
```

---

## Common gotchas

1. **`FRONTEND_URL` must match the browser origin** or API CORS fails. Restart the **api** container after changing it.
2. **Restart the frontend** after Auth0 / MinIO env changes so `env.js` regenerates; hard-refresh the browser.
3. **No build-time Auth0 config** — runtime `/env.js` only.
4. **AuthGuard ≠ backend user ready** — wait for `AuthStoreService.user()`.
5. **Open dialogs via `DialogService`** so `snippy-dialog` applies; tabbed settings need `snippy-dialog-tall`.
6. **Clear the snippet store on editor/fullpage destroy** — otherwise lists see a stale open pen.
7. **`setSnippet` resets dirty baseline** — use granular update methods while typing.
8. **Routes use `shortId`; PUT uses `snippetId`.**
9. **Partial CSS preview** can race an iframe reload — another edit or full rebuild recovers.
10. **Footer editor actions require a saved `snippetId`.**
11. **Dev proxy targets Docker DNS names** (`api`, `minio`) — host-only `ng serve` needs matching networking or proxy edits.
12. **Static legal routes must stay above `:username`.**
13. **Generation counters** — don’t assume the latest HTTP response wins if a newer load already started; trust the store’s generation checks.
14. **Theme allowlists** — adding a CodeMirror theme requires updating both FE and BE `EDITOR_THEME_KEYS` or `PUT /users` will reject the theme.
15. **Embed `theme` is URL-only** — it does not change the author’s saved editor preferences.

---

## Related docs

- Root deploy guide: [`README.md`](../README.md)
- Backend: [`documentation/backend.md`](./backend.md)
- Database: [`documentation/db.md`](./db.md)
- Frontend test plan: [`documentation/frontend-test-plan.md`](./frontend-test-plan.md)
