import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs, publicComment, publicSnippet } from '../helpers';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../modules/comment/comment.repo', () => ({
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  findCommentByCommentId: vi.fn(),
  findCommentsBySnippetId: vi.fn(),
  updateComment: vi.fn(),
  countReplies: vi.fn(),
}));

vi.mock('../../modules/snippet/snippet.repo', () => ({
  findBySnippetId: vi.fn(),
  incrementSnippetCommentCount: vi.fn(),
  decrementSnippetCommentCount: vi.fn(),
}));

vi.mock('../../modules/user/user.repo', () => ({
  findUserNamesByNames: vi.fn(),
}));

import {
  addCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
  getCommentsBySnippetIdHandler,
} from '../../modules/comment/comment.service';
import {
  createComment,
  deleteComment,
  findCommentByCommentId,
  findCommentsBySnippetId,
  updateComment,
  countReplies,
} from '../../modules/comment/comment.repo';
import {
  findBySnippetId,
  incrementSnippetCommentCount,
  decrementSnippetCommentCount,
} from '../../modules/snippet/snippet.repo';
import { findUserNamesByNames } from '../../modules/user/user.repo';

const auth = authAs('user-1');

describe('addCommentHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids commenting on another user private snippet', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    await expect(
      addCommentHandler({ auth, params: { snippetId: 'uuid-1' }, body: { content: 'Hi' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns 404 when the parent comment is missing', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(findCommentByCommentId).mockResolvedValue(null);

    await expect(
      addCommentHandler({
        auth,
        params: { snippetId: 'uuid-1' },
        body: { content: 'Hi', parentId: '550e8400-e29b-41d4-a716-446655440000' },
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects replies that are more than one level deep', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ parentCommentId: 'root-1' }) as any
    );

    await expect(
      addCommentHandler({
        auth,
        params: { snippetId: 'uuid-1' },
        body: { content: 'Hi', parentId: 'cmt-1' },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('resolves mentions and increments the snippet comment count', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(findUserNamesByNames).mockResolvedValue(['alice']);
    vi.mocked(createComment).mockResolvedValue(publicComment({ auth0Id: 'user-1' }) as any);
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'user-1', mentions: ['alice'] }) as any
    );

    const result = await addCommentHandler({
      auth,
      params: { snippetId: 'uuid-1' },
      body: { content: 'Hey @alice and @nobody' },
    });
    expect(findUserNamesByNames).toHaveBeenCalled();
    expect(incrementSnippetCommentCount).toHaveBeenCalledWith('uuid-1', undefined);
    expect(result.comment?.mentions).toEqual(['alice']);
    expect(result.comment?.isOwner).toBe(true);
  });
});

describe('updateCommentHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids updating another user comment', async () => {
    vi.mocked(findCommentByCommentId).mockResolvedValue(publicComment() as any);
    await expect(
      updateCommentHandler({
        auth,
        params: { commentId: 'cmt-1' },
        body: { content: 'Edited' },
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('strips protected fields before update', async () => {
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'user-1' }) as any
    );
    const body: Record<string, unknown> = {
      content: 'Edited',
      auth0Id: 'hacker',
      snippetId: 'other',
      commentId: 'other',
      parentCommentId: 'other',
    };

    await updateCommentHandler({
      auth,
      params: { commentId: 'cmt-1' },
      body: body as any,
    });
    expect(updateComment).toHaveBeenCalled();
    const patch = vi.mocked(updateComment).mock.calls[0][1] as Record<string, unknown>;
    expect(patch.auth0Id).toBeUndefined();
    expect(patch.snippetId).toBeUndefined();
    expect(patch.commentId).toBeUndefined();
    expect(patch.parentCommentId).toBeUndefined();
    expect(patch.content).toBe('Edited');
  });
});

describe('deleteCommentHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids deleting when the caller is neither author nor snippet owner', async () => {
    vi.mocked(findCommentByCommentId).mockResolvedValue(publicComment() as any);
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);

    await expect(
      deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('soft-deletes a comment that has replies', async () => {
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'user-1' }) as any
    );
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(countReplies).mockResolvedValue(2);

    const result = await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });
    expect(updateComment).toHaveBeenCalledWith(
      'cmt-1',
      { isDeleted: true, content: '' },
      undefined
    );
    expect(deleteComment).not.toHaveBeenCalled();
    expect(decrementSnippetCommentCount).not.toHaveBeenCalled();
    expect(result.message).toBe('Comment deleted successfully');
  });

  it('hard-deletes a comment with no replies as snippet owner', async () => {
    vi.mocked(findCommentByCommentId).mockResolvedValue(publicComment() as any);
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ auth0Id: 'user-1' }) as any);
    vi.mocked(countReplies).mockResolvedValue(0);

    await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });
    expect(deleteComment).toHaveBeenCalledWith('cmt-1', undefined);
    expect(decrementSnippetCommentCount).toHaveBeenCalledWith('uuid-1', undefined);
  });
});

describe('getCommentsBySnippetIdHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forbids listing comments on another user private snippet', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ isPrivate: true }) as any);
    await expect(
      getCommentsBySnippetIdHandler({ auth, params: { snippetId: 'uuid-1' } })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns comments for a public snippet', async () => {
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet() as any);
    vi.mocked(findCommentsBySnippetId).mockResolvedValue({
      rows: [publicComment() as any],
      count: 1,
    });

    const result = await getCommentsBySnippetIdHandler({
      auth,
      params: { snippetId: 'uuid-1' },
    });
    expect(result.totalCount).toBe(1);
    expect(result.comments?.[0].commentId).toBe('cmt-1');
  });
});
