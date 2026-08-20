export function authAs(sub: string) {
  return { payload: { sub } };
}

export function publicSnippet(overrides: Record<string, unknown> = {}) {
  return {
    snippetId: 'uuid-1',
    shortId: 'abc1234',
    auth0Id: 'owner',
    isPrivate: false,
    name: 'Pen',
    description: null,
    tags: [],
    forkCount: 0,
    viewCount: 4,
    commentCount: 0,
    favoriteCount: 0,
    snippetFiles: [],
    cdnResources: [],
    snapshotUrl: null,
    embedCount: 0,
    shareToken: null,
    parentShortId: null,
    parentName: null,
    parentUserName: null,
    user: { userName: 'owner', displayName: 'Owner' },
    ...overrides,
  };
}

export function publicUser(overrides: Record<string, unknown> = {}) {
  return {
    auth0Id: 'user-1',
    userName: 'alice',
    displayName: 'Alice',
    bio: null,
    pictureUrl: null,
    isPrivate: false,
    isAdmin: false,
    editorPreferences: null,
    assets: [],
    ...overrides,
  };
}

export function publicCollection(overrides: Record<string, unknown> = {}) {
  return {
    collectionId: 'col-1',
    shortId: 'col1234',
    auth0Id: 'owner',
    name: 'My Collection',
    description: null,
    isPrivate: false,
    user: { userName: 'owner', displayName: 'Owner' },
    ...overrides,
  };
}

export function publicComment(overrides: Record<string, unknown> = {}) {
  return {
    commentId: 'cmt-1',
    auth0Id: 'author',
    snippetId: 'uuid-1',
    content: 'Nice pen',
    parentCommentId: null,
    mentions: [],
    isDeleted: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    user: { userName: 'author', displayName: 'Author' },
    ...overrides,
  };
}
