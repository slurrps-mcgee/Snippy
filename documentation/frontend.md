# Snippy Frontend Architecture & Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [Routing](#routing)
3. [State Management](#state-management)
4. [Component Architecture](#component-architecture)
5. [Snippet Editing Flow](#snippet-editing-flow)
6. [Preview System](#preview-system)
7. [Save & Navigation Flow](#save--navigation-flow)
8. [Signal Reactivity & Effects](#signal-reactivity--effects)
9. [Communication Services](#communication-services)
10. [Authentication & Guards](#authentication--guards)
11. [Data Flow Diagram](#data-flow-diagram)
12. [Common Gotchas & Solutions](#common-gotchas--solutions)

---

## Overview

The Snippy frontend is an Angular 20+ single-page application (SPA) built with standalone components and Angular signals for reactive state management. It provides a CodePen-like interface where users can create, edit, and share code snippets with real-time HTML/CSS/JS previews.

**Key Technologies:**
- Angular 20+ (standalone components, signals)
- CodeMirror (code editor)
- RxJS (observables, async operations)
- Auth0 (authentication)
- Material Design (UI components)
- Angular Split (resizable panels)

---

## Routing

### Route Structure

```
Routes:
├── '' (HomePageComponent)
│   └── Default landing page, unauthenticated
├── 'home' (UserHomePageComponent, guarded)
│   └── User's snippet collection
├── 'public' (PublicPageComponent, guarded)
│   └── Publicly shared snippets
├── ':username/snippet/:id' (SnippetEditorPageComponent, guarded)
│   └── Edit existing snippet by owner
├── 'snippet' (SnippetEditorPageComponent, guarded)
│   └── Create new snippet
├── ':username' (ProfilePageComponent, guarded)
│   └── User profile & their public snippets
└── '**' → redirects to home
```

### Route Guards

1. **AuthGuard** (Auth0)
   - Protects all routes except home page
   - Redirects unauthenticated users to Auth0 login
   - Added by Auth0 Angular SDK

2. **unsavedChangesGuard**
   - Applied to snippet editor routes
   - Prompts user before leaving if there are unsaved changes
   - Uses `SnippetStoreService.isDirty()` to detect changes

---

## State Management

### SnippetStoreService

Located: `src/app/shared/services/store.services/snippet.store.service.ts`

Central hub for all snippet state using Angular signals.

#### Core Signals

```typescript
snippet = signal<Snippet | null>(null)
  └── Current loaded/edited snippet with all properties

snippetList = signal<SnippetListResponse | null>(null)
  └── Paginated list of snippets

previewUpdateType = signal<string | null>(null)
  ├── 'full': Complete iframe reload (HTML/JS changes)
  ├── 'partial': CSS-only update (live CSS editing)
  └── null: No preview update

loading = signal<boolean>(false)
  └── Indicates async operation in progress

error = signal<string | null>(null)
  └── Error message from last operation

isDirty = computed(() => {...})
  └── Compares current snippet with originalSnippet
```

#### API Methods

**loadSnippet(snippetId)**: Fetches single snippet, sets previewUpdateType to 'full'

**saveSnippet()**: Posts snippet to backend, calls setSnippet with response

**updateSnippetFile(fileType, content)**: 
- Sets previewUpdateType = 'full' for HTML/JS
- Sets previewUpdateType = 'partial' for CSS
- Called on every keystroke in editor

**updateSnippetSettings(settings)**: Updates metadata, sets previewUpdateType = 'full'

**setSnippet(snippet, updatePreview)**: 
- Updates both snippet and originalSnippet signals
- If updatePreview=true: sets previewUpdateType = 'full'

---

## Component Architecture

### Page Components

#### SnippetEditorPageComponent (Main Editor)

**File:** `src/app/core/pages/snippet-editor-page/snippet-editor-page.component.ts`

Handles both creating new and editing existing snippets.

**Flow:**
```
ngOnInit():
├── Get :id from route param
├── If exists: load snippet from backend
└── If not: create blank snippet

@HostListener('window:keydown.control.s'):
└── Save on Ctrl+S

saveSnippetAndHandleUI():
├── Check isDirty
├── Save to backend
├── Show snackbar
└── If new: navigate to /:userName/snippet/:shortId
```

### View Components

#### SnippetWebViewComponent (Preview Coordinator)

**File:** `src/app/shared/components/views/snippet-web-view/snippet-web-view.component.ts`

**Critical Effect:**
```typescript
effect(() => {
  const snippet = snippetStoreService.snippet()
  const previewUpdateType = snippetStoreService.previewUpdateType()

  if (!previewUpdateType || !snippet?.snippetFiles) return
  
  const htmlFile = snippet.snippetFiles.find(f => f.fileType === 'html')
  const cssFile = snippet.snippetFiles.find(f => f.fileType === 'css')
  const jsFile = snippet.snippetFiles.find(f => f.fileType === 'js')
  
  this.previewComponent.updatePreview(
    htmlFile?.content || '',
    cssFile?.content || '',
    jsFile?.content || '',
    previewUpdateType,
    snippet.externalResources || []
  )
})
```

This effect automatically updates preview when:
- `snippet()` signal changes (any property)
- `previewUpdateType()` signal changes

#### SnippetEditorComponent (CodeMirror Wrapper)

**File:** `src/app/shared/components/snippet-editor/snippet-editor.component.ts`

**Input:** `@Input() editorType: 'html' | 'css' | 'js'`

**Initialization:**
```
ngAfterViewInit():
└── Initialize CodeMirror with appropriate language

EditorView.updateListener:
├── On keystroke, update code signal
└── Call snippetStoreService.updateSnippetFile(type, value)
    └── Triggers preview update via effect
```

**Sync Effect:**
```typescript
effect(() => {
  const snippet = snippetStoreService.snippet()
  if (snippet?.snippetFiles) {
    const file = snippet.snippetFiles.find(f => f.fileType === editorType)
    if (file && file.content !== code()) {
      code.set(file.content)
      updateEditorContent(file.content) // Update CodeMirror
    }
  }
})
```

Keeps editor in sync if store updates externally.

#### SnippetPreviewComponent (iframe Manager)

**File:** `src/app/shared/components/snippet-preview/snippet-preview.component.ts`

```typescript
updatePreview(html, css, js, previewUpdateType, externalResources):
├── If previewUpdateType === 'partial':
│   └── updateCssOnly(css)
│       ├── Access iframe.contentDocument
│       └── Update <style id="snippet-style">
│
└── Else:
    └── fullReload(html, css, js, externalResources)
        └── Set iframe.srcdoc = complete HTML string
```

---

## Snippet Editing Flow

### Creating New Snippet

```
1. User clicks "New Snippet"
   └── Navigate to /snippet

2. SnippetEditorPageComponent.ngOnInit():
   └── Create blank snippet

3. User types in HTML editor
   ├── CodeMirror updateListener fires
   ├── snippetStoreService.updateSnippetFile('html', content)
   │   ├── Sets previewUpdateType = 'full'
   │   └── Updates snippet.snippetFiles[0].content
   └── SnippetWebViewComponent effect detects change
       └── Calls previewComponent.updatePreview('full')
           └── iframe.srcdoc is set

4. User types in CSS editor
   ├── snippetStoreService.updateSnippetFile('css', content)
   │   ├── Sets previewUpdateType = 'partial'
   │   └── Updates snippet.snippetFiles[1].content
   └── SnippetWebViewComponent effect detects change
       └── Only <style> tag is updated in-place

5. User saves (Ctrl+S or button)
   ├── snippetStoreService.saveSnippet()
   │   ├── POST to /snippets endpoint
   │   ├── Backend generates shortId
   │   ├── Call setSnippet(response.snippet, true)
   │   │   └── Sets previewUpdateType = 'full'
   │   └── Return response
   ├── Show success snackbar
   └── Navigate to /:userName/snippet/:shortId
```

### Editing Existing Snippet

```
1. Navigate to /:username/snippet/:shortId

2. SnippetEditorPageComponent.ngOnInit():
   └── snippetStoreService.loadSnippet(shortId)
       ├── GET /snippets/:shortId
       ├── Call setSnippet(response.snippet, true)
       │   └── Sets previewUpdateType = 'full'
       └── originalSnippet = copy of snippet

3. SnippetWebViewComponent effect triggers
   └── Preview iframe is populated

4. User edits code (same as new snippet flow)

5. User saves
   ├── POST /snippets/:shortId (PATCH for update)
   ├── setSnippet(response.snippet, false)
   │   └── updatePreview=false (avoid unnecessary reload)
   └── originalSnippet updated
```

---

## Preview System

### Full Reload ('full')

**When:**
- New snippet created
- Snippet loaded from backend
- HTML or JS code changes
- Settings changed
- After save (for new snippets)

**Process:**
```
fullReload(html, css, js, externalResources):
├── Build complete HTML string with:
│   ├── DOCTYPE, meta tags
│   ├── External stylesheets
│   ├── <style> with CSS code
│   ├── <body> with HTML code
│   ├── <script> with JS code
│   └── External scripts
└── Set iframe.srcdoc = htmlString
    └── Entire iframe reloads
```

**Pros:**
- Guarantees clean state
- Prevents memory leaks
- Required for HTML/JS changes

**Cons:**
- Less smooth
- Any state in user's JS is lost

### Partial Update ('partial')

**When:**
- Only CSS code changes (live editing)

**Process:**
```
updateCssOnly(css):
├── Access iframe.contentDocument
├── Find or create <style id="snippet-style">
└── Set styleEl.textContent = css
    └── CSS updated without iframe reload
```

**Pros:**
- Smooth live CSS editing
- User's JS state preserved
- Fast

**Cons:**
- Requires iframe to exist
- Fails if iframe is empty

### Issue We Fixed

**Problem:** After save, CSS-only edit cleared preview

**Root Cause:** 
- `updateCssOnly()` tried to update style tag
- If iframe was empty, update failed silently
- Preview appeared blank

**Solution:**
- Guard in `updateCssOnly()`: check if iframe.contentDocument exists
- If not, fall back to full reload
- Ensure after every save, next update is 'full'

---

## Save & Navigation Flow

### Saving Mechanism

**SnippetSaveUIService** centralizes save logic:

```typescript
saveSnippetWithUI(snippetStoreService, userGetter):
├── Get isNew = !snippetStoreService.snippet()?.shortId
├── Check isDirty() (return if not)
├── Try:
│   ├── Await snippetStoreService.saveSnippet()
│   │   ├── API call to backend
│   │   └── Store updated via setSnippet()
│   ├── Show success snackbar
│   ├── If isNew && response.snippet.shortId:
│   │   └── Navigate to /:userName/snippet/:shortId
│   └── (existing snippet stays at current URL)
└── Catch:
    └── Show error snackbar
```

### Save Triggers

1. **Keyboard Shortcut (Ctrl+S)** in SnippetEditorPageComponent
2. **Navbar Save Button** in NavbarComponent
3. **Auto-save on Settings Change** in NavbarComponent

### Unsaved Changes Guard

```typescript
unsavedChangesGuard:
├── Checks canDeactivate()
├── Calls snippetStoreService.isDirty()
├── If dirty:
│   └── Prompt user: "Leave without saving?"
└── If not dirty:
    └── Allow navigation
```

Applied to snippet editor routes.

---

## Signal Reactivity & Effects

### What Are Signals?

Fine-grained reactive primitives (like Vue.ref, Svelte stores):

```typescript
const count = signal(0)
count()              // Read value
count.set(1)         // Update
count.update(v => v+1) // Update with function

const doubled = computed(() => count() * 2) // Auto-memoized

effect(() => {
  console.log('Count changed:', count()) // Runs when count changes
})
```

### Why Effects Instead of RxJS Subscriptions?

**Benefits:**
- Automatic cleanup on component destroy
- Simpler syntax (no operators needed)
- Fine-grained tracking (only re-runs if accessed properties change)
- More intuitive for imperative DOM updates

### Key Effects in Snippy

#### 1. SnippetWebViewComponent (Preview Trigger)

Watches both `snippet()` and `previewUpdateType()` signals.

When either changes:
1. Extract HTML, CSS, JS from snippet
2. Call `previewComponent.updatePreview()`
3. Preview component decides full vs. partial reload

**Dependency tracking:** Only re-runs if accessed properties change.

#### 2. SnippetEditorComponent (Editor Sync)

Watches `snippet()` signal.

If file content differs from local code signal:
1. Update local code signal
2. Update CodeMirror editor
3. Keep editor in sync with store

#### 3. CodeMirror Update Listener

Direct event listener (not an effect):

```
User types → CodeMirror updateListener fires
  → Call snippetStoreService.updateSnippetFile()
    → Set previewUpdateType
    → Update snippet.snippetFiles
      → SnippetWebViewComponent effect detects change
        → Preview updates automatically
```

---

## Communication Services

### SnippetSaveUIService

**File:** `src/app/shared/services/communication/snippet-save-ui.service.ts`

Centralizes save UI logic so navbar and editor don't duplicate code.

**Why separate from store?**
- Store handles data/API
- UI service handles presentation (snackbars, navigation)
- Keeps concerns separated
- Reusable across components

### AuthStoreService

Wraps Auth0 user state in Angular signals.

```typescript
user = signal<User | null>(null)
isLoggedIn = signal<boolean>(false)

// Set via subscription to Auth0
auth0Service.user$.subscribe(user => {
  this.user.set(user)
  this.isLoggedIn.set(!!user)
})
```

---

## Authentication & Guards

### Auth0 Integration

Protected routes require AuthGuard from `@auth0/auth0-angular`.

User data accessible via `AuthStoreService.user()` or `auth0Service.user$`.

### Unsaved Changes Guard

```typescript
canDeactivateFn(component) {
  if (component instanceof SnippetEditorPageComponent) {
    if (component.snippetStoreService.isDirty()) {
      return confirm('You have unsaved changes. Leave without saving?')
    }
  }
  return true
}
```

Applied to: `:username/snippet/:id` and `snippet` routes.

---

## Data Flow Diagram

### Edit & Preview Flow

```
User types in CodeMirror
    ↓
CodeMirror updateListener fires
    ↓
snippetStoreService.updateSnippetFile(type, content)
├── Set previewUpdateType = 'full'|'partial'
└── Update snippet.snippetFiles
    ↓
SnippetWebViewComponent effect detects change
├── Extract html, css, js from snippet
└── Call previewComponent.updatePreview()
    ↓
SnippetPreviewComponent.updatePreview()
├── If 'partial': updateCssOnly(css)
└── If 'full': fullReload(html, css, js)
    ↓
iframe.srcdoc or iframe.contentDocument updated
    ↓
Preview renders in real-time
```

### Save & Navigate Flow

```
User presses Ctrl+S or clicks Save
    ↓
SnippetEditorPageComponent.saveSnippetAndHandleUI()
    ↓
SnippetSaveUIService.saveSnippetWithUI()
├── Call snippetStoreService.saveSnippet()
│   ├── POST /snippets (or PATCH for update)
│   └── Backend returns updated snippet
│   ├── Call setSnippet(response.snippet, true/false)
│   │   └── Set previewUpdateType = 'full' (if updatePreview=true)
│   └── Return response
├── Show success snackbar
├── If new snippet & has shortId:
│   └── Navigate to /:userName/snippet/:shortId
└── (existing snippet stays in place)
    ↓
originalSnippet updated
    ↓
isDirty returns false
    ↓
Unsaved changes guard allows navigation
```

### Load Existing Snippet Flow

```
Navigate to /:username/snippet/:shortId
    ↓
Route guard checks Auth0
    ↓
SnippetEditorPageComponent.ngOnInit()
├── Get :id from route.snapshot.paramMap
└── Call snippetStoreService.loadSnippet(id)
    ├── GET /snippets/:id
    ├── Call setSnippet(response.snippet, true)
    │   └── Set previewUpdateType = 'full'
    └── Set originalSnippet = copy
    ↓
SnippetWebViewComponent effect triggers
├── Detects previewUpdateType = 'full'
└── Calls previewComponent.updatePreview()
    └── fullReload() sets iframe.srcdoc
    ↓
Preview displays loaded snippet
    ↓
isDirty = false (snippet === originalSnippet)
```

---

## Common Gotchas & Solutions

### CSS-Only Edit Clears Preview

**Problem:** After save, user edits only CSS and preview appears blank.

**Root Cause:**
- `updateSnippetFile('css', ...)` sets previewUpdateType = 'partial'
- `updateCssOnly()` tries to update style tag
- If iframe was just reloaded and contentDocument is null, update fails silently
- Preview appears blank

**Solution:**
- Guard in `updateCssOnly()`: check if iframe.contentDocument exists
- If not, fall back to full reload
- Ensure after every save, first update is 'full'

### Changes Not Reflecting in Preview

**Problem:** User types but preview doesn't update.

**Debug steps:**
1. Check if previewUpdateType is changing (add console.log in effect)
2. Check if snippet signal is changing (verify CodeMirror listener fires)
3. Check if preview component exists (@ViewChild is defined)
4. Check if updateSnippetFile is being called

```typescript
// Add to effect
effect(() => {
  const snippet = snippetStoreService.snippet()
  const previewType = snippetStoreService.previewUpdateType()
  console.log('Effect fired:', { snippet, previewType })
})

// Add to updateSnippetFile
updateSnippetFile(fileType: string, content: string) {
  console.log('updateSnippetFile called:', { fileType, contentLength: content.length })
  // ... rest of code
}
```

### Dirty Check Always False

**Problem:** isDirty returns false even after edits.

**Cause:** originalSnippet is updated when it shouldn't be (should only update on load/save).

**Solution:** 
- Only call setSnippet after load or save
- `updateSnippetFile()` should only update `snippet()`, not `originalSnippet`
- Check if setSnippet is being called unexpectedly

### Navigation Doesn't Work After Save

**Problem:** User saves new snippet but navigation doesn't happen.

**Cause:** Backend not returning shortId or response format is wrong.

**Debug:**
```typescript
async saveSnippet() {
  const s = this.snippet()
  // ...
  let res = await firstValueFrom(this.snippetService.saveSnippet(s))
  console.log('Save response:', res) // Check structure
  // ...
}
```

---

## Summary

The Snippy frontend uses:

1. **Signals** for fine-grained reactive state
2. **Effects** to automatically trigger preview updates when state changes
3. **Services** to centralize API calls and shared logic
4. **Components** organized by responsibility (pages, views, editors, preview)
5. **Guards** to protect routes and warn of unsaved changes
6. **Communication services** to avoid code duplication

**Core Flow:**
- User edits code → CodeMirror listener fires
- Store updated → `snippet()` signal changes
- Effect runs → Extracts code from store
- Preview updates → iframe.srcdoc or CSS tag changes
- Real-time preview → User sees changes instantly

This reactive architecture ensures the UI always stays in sync with the underlying data model, making the editor feel responsive and reliable.
