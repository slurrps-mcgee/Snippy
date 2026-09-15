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
    vi.mocked(deleteComment).mockResolvedValue(1);

    await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });
    expect(deleteComment).toHaveBeenCalledWith('cmt-1', undefined);
    expect(decrementSnippetCommentCount).toHaveBeenCalledWith('uuid-1', undefined);
  });

  it('does not decrement counter when comment was already deleted', async () => {
    vi.mocked(findCommentByCommentId).mockResolvedValue(publicComment() as any);
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ auth0Id: 'user-1' }) as any);
    vi.mocked(countReplies).mockResolvedValue(0);
    vi.mocked(deleteComment).mockResolvedValue(0);

    const result = await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });
    expect(deleteComment).toHaveBeenCalledWith('cmt-1', undefined);
    expect(decrementSnippetCommentCount).not.toHaveBeenCalled();
    expect(result.message).toBe('Comment deleted successfully');
  });

  it('prevents double-decrement when deleteComment returns 0 (concurrent deletion mitigation)', async () => {
    // This test verifies the fix for the concurrent deletion vulnerability
    // Scenario: Two concurrent DELETE requests for the same comment
    // First request deletes the row, second request gets 0 affected rows
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'user-1' }) as any
    );
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ auth0Id: 'user-1' }) as any);
    vi.mocked(countReplies).mockResolvedValue(0);
    vi.mocked(deleteComment).mockResolvedValue(0); // Simulates second concurrent request

    const result = await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });

    // Verify the security property: counter is NOT decremented when no row was deleted
    expect(deleteComment).toHaveBeenCalledWith('cmt-1', undefined);
    expect(decrementSnippetCommentCount).not.toHaveBeenCalled();
    expect(result.message).toBe('Comment deleted successfully');
  });

  it('only decrements counter when deleteComment returns positive count', async () => {
    // Verify that decrement is conditional on successful deletion
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'user-1' }) as any
    );
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ auth0Id: 'user-1' }) as any);
    vi.mocked(countReplies).mockResolvedValue(0);
    vi.mocked(deleteComment).mockResolvedValue(1); // Successful deletion

    await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });

    // Verify the security property: counter IS decremented when a row was deleted
    expect(deleteComment).toHaveBeenCalledWith('cmt-1', undefined);
    expect(decrementSnippetCommentCount).toHaveBeenCalledWith('uuid-1', undefined);
    expect(decrementSnippetCommentCount).toHaveBeenCalledTimes(1);
  });

  it('handles race condition where comment is deleted between authorization and deletion', async () => {
    // Simulates: Request passes authorization check, but comment is deleted before deleteComment executes
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'user-1' }) as any
    );
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ auth0Id: 'user-1' }) as any);
    vi.mocked(countReplies).mockResolvedValue(0);
    vi.mocked(deleteComment).mockResolvedValue(0); // Comment already deleted by concurrent request

    const result = await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });

    // Verify idempotency: operation succeeds without corrupting counter
    expect(decrementSnippetCommentCount).not.toHaveBeenCalled();
    expect(result.message).toBe('Comment deleted successfully');
  });

  it('prevents counter corruption when multiple authorized users delete same comment', async () => {
    // Scenario: Comment author and snippet owner both try to delete the same comment
    // Both are authorized, but only one should decrement the counter
    const commentAuthor = authAs('comment-author');
    const snippetOwner = authAs('snippet-owner');

    // First deletion (by comment author) - succeeds
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'comment-author' }) as any
    );
    vi.mocked(findBySnippetId).mockResolvedValue(
      publicSnippet({ auth0Id: 'snippet-owner' }) as any
    );
    vi.mocked(countReplies).mockResolvedValue(0);
    vi.mocked(deleteComment).mockResolvedValueOnce(1); // First call succeeds

    await deleteCommentHandler({ auth: commentAuthor, params: { commentId: 'cmt-1' } });
    expect(decrementSnippetCommentCount).toHaveBeenCalledTimes(1);

    // Second deletion (by snippet owner) - returns 0 affected rows
    vi.mocked(deleteComment).mockResolvedValueOnce(0); // Second call returns 0

    await deleteCommentHandler({ auth: snippetOwner, params: { commentId: 'cmt-1' } });

    // Verify: counter was only decremented once, not twice
    expect(decrementSnippetCommentCount).toHaveBeenCalledTimes(1);
  });

  it('ensures deleteComment return value is checked before decrementing', async () => {
    // Explicit test that the return value from deleteComment is used
    vi.mocked(findCommentByCommentId).mockResolvedValue(
      publicComment({ auth0Id: 'user-1' }) as any
    );
    vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ auth0Id: 'user-1' }) as any);
    vi.mocked(countReplies).mockResolvedValue(0);

    // Test with various return values
    const testCases = [
      { deletedCount: 0, shouldDecrement: false },
      { deletedCount: 1, shouldDecrement: true },
      { deletedCount: 2, shouldDecrement: true }, // Edge case: shouldn't happen but should still decrement
    ];

    for (const testCase of testCases) {
      vi.clearAllMocks();
      vi.mocked(findCommentByCommentId).mockResolvedValue(
        publicComment({ auth0Id: 'user-1' }) as any
      );
      vi.mocked(findBySnippetId).mockResolvedValue(publicSnippet({ auth0Id: 'user-1' }) as any);
      vi.mocked(countReplies).mockResolvedValue(0);
      vi.mocked(deleteComment).mockResolvedValue(testCase.deletedCount);

      await deleteCommentHandler({ auth, params: { commentId: 'cmt-1' } });

      if (testCase.shouldDecrement) {
        expect(decrementSnippetCommentCount).toHaveBeenCalled();
      } else {
        expect(decrementSnippetCommentCount).not.toHaveBeenCalled();
      }
    }
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
