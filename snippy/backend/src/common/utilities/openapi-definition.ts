/**
 * OpenAPI 3 document used by swagger-jsdoc / export.
 * Controller JSDoc is not the source of truth — this file is.
 */
import { version } from '../../../package.json';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const json = (schema: object) => ({
  content: { 'application/json': { schema } },
});

const bearer = [{ bearerAuth: [] }];

const pageQuery = [
  { name: 'page', in: 'query', schema: { type: 'integer' } },
  { name: 'limit', in: 'query', schema: { type: 'integer' } },
  { name: 'q', in: 'query', schema: { type: 'string' } },
];

const sortQuery = [
  ...pageQuery,
  {
    name: 'sort',
    in: 'query',
    schema: { type: 'string', enum: ['newest', 'views', 'favorites', 'forks'] },
  },
  { name: 'tag', in: 'query', schema: { type: 'string' } },
];

const err = {
  '400': { description: 'Bad request', ...json(ref('ErrorResponse')) },
  '401': { description: 'Unauthorized', ...json(ref('ErrorResponse')) },
  '403': { description: 'Forbidden', ...json(ref('ErrorResponse')) },
  '404': { description: 'Not found', ...json(ref('ErrorResponse')) },
};

export const openapiDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Snippy API',
    version,
    description: 'API documentation for Snippy',
  },
  servers: [{ url: '/api/v1', description: 'API v1 server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token for authorization',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
      CdnResource: {
        type: 'object',
        properties: {
          resourceType: { type: 'string' },
          url: { type: 'string' },
        },
      },
      SnippetFile: {
        type: 'object',
        properties: {
          snippetFileID: { type: 'string', nullable: true },
          fileType: { type: 'string' },
          content: { type: 'string' },
        },
      },
      Snippet: {
        type: 'object',
        properties: {
          snippetId: { type: 'string', nullable: true },
          shortId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          tags: { type: 'array', items: { type: 'string' }, nullable: true },
          isPrivate: { type: 'boolean' },
          forkCount: { type: 'integer' },
          viewCount: { type: 'integer' },
          embedCount: { type: 'integer' },
          commentCount: { type: 'integer' },
          favoriteCount: { type: 'integer' },
          parentShortId: { type: 'string', nullable: true },
          parentName: { type: 'string', nullable: true },
          parentUserName: { type: 'string', nullable: true },
          isOwner: { type: 'boolean' },
          isFavorited: { type: 'boolean' },
          userName: { type: 'string' },
          displayName: { type: 'string', nullable: true },
          snippetFiles: { type: 'array', items: ref('SnippetFile') },
          cdnResources: { type: 'array', items: ref('CdnResource') },
          snapshotUrl: { type: 'string', nullable: true },
          shareToken: { type: 'string', nullable: true },
          updatedAt: { type: 'string' },
        },
      },
      SnippetList: {
        type: 'object',
        properties: {
          snippetId: { type: 'string' },
          shortId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          tags: { type: 'array', items: { type: 'string' }, nullable: true },
          userName: { type: 'string' },
          displayName: { type: 'string' },
          commentCount: { type: 'integer' },
          favoriteCount: { type: 'integer' },
          viewCount: { type: 'integer' },
          embedCount: { type: 'integer' },
          isOwner: { type: 'boolean' },
          isFavorited: { type: 'boolean' },
          isFollowing: { type: 'boolean' },
          parentShortId: { type: 'string', nullable: true },
          parentName: { type: 'string', nullable: true },
          parentUserName: { type: 'string', nullable: true },
          snapshotUrl: { type: 'string', nullable: true },
          updatedAt: { type: 'string' },
        },
      },
      SnippetResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          snippet: ref('Snippet'),
        },
      },
      SnippetListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          snippets: { type: 'array', items: ref('SnippetList') },
          totalCount: { type: 'integer' },
        },
      },
      CreateSnippetRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          isPrivate: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' } },
          snippetFiles: { type: 'array', items: ref('SnippetFile') },
          cdnResources: { type: 'array', items: ref('CdnResource') },
        },
      },
      ShareTokenResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          shareToken: { type: 'string' },
        },
      },
      ViewCountResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          viewCount: { type: 'integer' },
          counted: { type: 'boolean' },
        },
      },
      EditorPreferences: {
        type: 'object',
        properties: {
          fontSize: { type: 'number' },
          fontFamily: { type: 'string' },
          indentWith: { type: 'string', enum: ['spaces', 'tabs'] },
          indentWidth: { type: 'integer' },
          lineNumbers: { type: 'boolean' },
          lineWrapping: { type: 'boolean' },
          codeFolding: { type: 'boolean' },
          autocomplete: { type: 'boolean' },
          matchBrackets: { type: 'boolean' },
          theme: { type: 'string' },
        },
      },
      Asset: {
        type: 'object',
        properties: {
          assetId: { type: 'string' },
          fileName: { type: 'string' },
          fileType: { type: 'string' },
          url: { type: 'string' },
          objectKey: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          userName: { type: 'string' },
          displayName: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          pictureUrl: { type: 'string', nullable: true },
          isPrivate: { type: 'boolean' },
          editorPreferences: ref('EditorPreferences'),
          isFollowing: { type: 'boolean' },
          followerCount: { type: 'integer' },
          followingCount: { type: 'integer' },
          assets: { type: 'array', items: ref('Asset') },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: ref('User'),
          created: { type: 'boolean' },
        },
      },
      UsernameAvailableResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          available: { type: 'boolean' },
        },
      },
      Collection: {
        type: 'object',
        properties: {
          collectionId: { type: 'string' },
          shortId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          isPrivate: { type: 'boolean' },
          isOwner: { type: 'boolean' },
          userName: { type: 'string' },
          displayName: { type: 'string' },
          snippetCount: { type: 'integer' },
          containsSnippet: { type: 'boolean' },
          snippets: { type: 'array', items: ref('SnippetList') },
        },
      },
      CollectionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          collection: ref('Collection'),
          message: { type: 'string' },
        },
      },
      CollectionListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          collections: { type: 'array', items: ref('Collection') },
          totalCount: { type: 'integer' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          commentId: { type: 'string' },
          content: { type: 'string' },
          userName: { type: 'string' },
          displayName: { type: 'string' },
          isOwner: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
      CommentResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          comment: ref('Comment'),
        },
      },
      CommentListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          comments: { type: 'array', items: ref('Comment') },
          totalCount: { type: 'integer' },
        },
      },
      FavoriteResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          isFavorited: { type: 'boolean' },
          favoriteCount: { type: 'integer' },
        },
      },
      FavoriteStatusResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          isFavorited: { type: 'boolean' },
        },
      },
      FollowResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          isFollowing: { type: 'boolean' },
        },
      },
      UserListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          users: { type: 'array', items: ref('User') },
          totalCount: { type: 'integer' },
        },
      },
      AssetResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          asset: ref('Asset'),
          url: { type: 'string' },
          message: { type: 'string' },
        },
      },
      AssetListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          assets: { type: 'array', items: ref('Asset') },
          totalCount: { type: 'integer' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          minio: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        operationId: 'getHealth',
        tags: ['Ops'],
        summary: 'Liveness',
        security: [],
        responses: { '200': { description: 'OK', ...json(ref('HealthResponse')) } },
      },
    },
    '/ready': {
      get: {
        operationId: 'getReady',
        tags: ['Ops'],
        summary: 'Readiness',
        security: [],
        responses: { '200': { description: 'Ready', ...json(ref('HealthResponse')) } },
      },
    },
    '/snippets': {
      post: {
        operationId: 'createSnippet',
        tags: ['Snippet'],
        security: bearer,
        requestBody: { required: true, ...json(ref('CreateSnippetRequest')) },
        responses: { '201': { description: 'Created', ...json(ref('SnippetResponse')) }, ...err },
      },
    },
    '/snippets/{shortId}': {
      get: {
        operationId: 'getSnippetByShortId',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'shortId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Snippet', ...json(ref('SnippetResponse')) }, ...err },
      },
    },
    '/snippets/{snippetId}': {
      put: {
        operationId: 'updateSnippet',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, ...json(ref('CreateSnippetRequest')) },
        responses: { '200': { description: 'Updated', ...json(ref('SnippetResponse')) }, ...err },
      },
      delete: {
        operationId: 'deleteSnippet',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deleted' }, ...err },
      },
    },
    '/snippets/{shortId}/embed': {
      get: {
        operationId: 'getSnippetEmbed',
        tags: ['Snippet'],
        security: [],
        parameters: [{ name: 'shortId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'HTML',
            content: { 'text/html': { schema: { type: 'string' } } },
          },
          ...err,
        },
      },
    },
    '/snippets/{snippetId}/snapshot': {
      post: {
        operationId: 'uploadSnippetSnapshot',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Snapshot', ...json(ref('SnippetResponse')) }, ...err },
      },
    },
    '/snippets/fork/{snippetId}': {
      post: {
        operationId: 'forkSnippet',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Forked', ...json(ref('SnippetResponse')) }, ...err },
      },
    },
    '/snippets/public': {
      get: {
        operationId: 'getPublicSnippets',
        tags: ['Snippet'],
        security: bearer,
        parameters: sortQuery,
        responses: { '200': { description: 'List', ...json(ref('SnippetListResponse')) }, ...err },
      },
    },
    '/snippets/feed': {
      get: {
        operationId: 'getFeedSnippets',
        tags: ['Snippet'],
        security: bearer,
        parameters: sortQuery,
        responses: { '200': { description: 'Feed', ...json(ref('SnippetListResponse')) }, ...err },
      },
    },
    '/snippets/me': {
      get: {
        operationId: 'getMySnippets',
        tags: ['Snippet'],
        security: bearer,
        parameters: pageQuery,
        responses: { '200': { description: 'Mine', ...json(ref('SnippetListResponse')) }, ...err },
      },
    },
    '/snippets/search': {
      get: {
        operationId: 'searchSnippets',
        tags: ['Snippet'],
        security: bearer,
        parameters: sortQuery,
        responses: { '200': { description: 'Search', ...json(ref('SnippetListResponse')) }, ...err },
      },
    },
    '/snippets/user/{userName}': {
      get: {
        operationId: 'getUserPublicSnippets',
        tags: ['Snippet'],
        security: bearer,
        parameters: [
          { name: 'userName', in: 'path', required: true, schema: { type: 'string' } },
          ...pageQuery,
        ],
        responses: { '200': { description: 'User pens', ...json(ref('SnippetListResponse')) }, ...err },
      },
    },
    '/snippets/{snippetId}/view': {
      post: {
        operationId: 'recordSnippetView',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'View', ...json(ref('ViewCountResponse')) }, ...err },
      },
    },
    '/snippets/shared/{token}': {
      get: {
        operationId: 'getSharedSnippet',
        tags: ['Snippet'],
        security: [],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Shared', ...json(ref('SnippetResponse')) }, ...err },
      },
    },
    '/snippets/{snippetId}/share': {
      post: {
        operationId: 'createSnippetShareLink',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Token', ...json(ref('ShareTokenResponse')) }, ...err },
      },
      delete: {
        operationId: 'revokeSnippetShareLink',
        tags: ['Snippet'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Revoked' }, ...err },
      },
    },
    '/users': {
      post: {
        operationId: 'ensureUser',
        tags: ['User'],
        security: bearer,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            properties: { name: { type: 'string' }, pictureUrl: { type: 'string' } },
          }),
        },
        responses: {
          '200': { description: 'Existing', ...json(ref('UserResponse')) },
          '201': { description: 'Created', ...json(ref('UserResponse')) },
          ...err,
        },
      },
      put: {
        operationId: 'updateUser',
        tags: ['User'],
        security: bearer,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            properties: {
              userName: { type: 'string' },
              displayName: { type: 'string' },
              bio: { type: 'string', nullable: true },
              pictureUrl: { type: 'string', nullable: true },
              isPrivate: { type: 'boolean' },
              editorPreferences: ref('EditorPreferences'),
            },
          }),
        },
        responses: { '200': { description: 'Updated', ...json(ref('UserResponse')) }, ...err },
      },
      delete: {
        operationId: 'deleteUser',
        tags: ['User'],
        security: bearer,
        responses: { '204': { description: 'Deleted' }, ...err },
      },
    },
    '/users/{userName}': {
      get: {
        operationId: 'getUserProfile',
        tags: ['User'],
        security: bearer,
        parameters: [{ name: 'userName', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Profile', ...json(ref('UserResponse')) }, ...err },
      },
    },
    '/users/me': {
      get: {
        operationId: 'getCurrentUser',
        tags: ['User'],
        security: bearer,
        responses: { '200': { description: 'Me', ...json(ref('UserResponse')) }, ...err },
      },
    },
    '/users/check-username/{userName}': {
      get: {
        operationId: 'checkUsername',
        tags: ['User'],
        security: bearer,
        parameters: [{ name: 'userName', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Availability', ...json(ref('UsernameAvailableResponse')) },
          ...err,
        },
      },
    },
    '/users/picture': {
      post: {
        operationId: 'uploadProfilePicture',
        tags: ['User'],
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Picture', ...json(ref('UserResponse')) }, ...err },
      },
    },
    '/users/{userName}/follow': {
      post: {
        operationId: 'followUser',
        tags: ['Follow'],
        security: bearer,
        parameters: [{ name: 'userName', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Followed', ...json(ref('FollowResponse')) }, ...err },
      },
      delete: {
        operationId: 'unfollowUser',
        tags: ['Follow'],
        security: bearer,
        parameters: [{ name: 'userName', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Unfollowed', ...json(ref('FollowResponse')) }, ...err },
      },
    },
    '/users/{userName}/followers': {
      get: {
        operationId: 'getFollowers',
        tags: ['Follow'],
        security: bearer,
        parameters: [
          { name: 'userName', in: 'path', required: true, schema: { type: 'string' } },
          ...pageQuery,
        ],
        responses: { '200': { description: 'Followers', ...json(ref('UserListResponse')) }, ...err },
      },
    },
    '/users/{userName}/following': {
      get: {
        operationId: 'getFollowing',
        tags: ['Follow'],
        security: bearer,
        parameters: [
          { name: 'userName', in: 'path', required: true, schema: { type: 'string' } },
          ...pageQuery,
        ],
        responses: { '200': { description: 'Following', ...json(ref('UserListResponse')) }, ...err },
      },
    },
    '/favorites/{snippetId}': {
      post: {
        operationId: 'toggleFavorite',
        tags: ['Favorites'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Toggled', ...json(ref('FavoriteResponse')) }, ...err },
      },
      get: {
        operationId: 'getFavoriteStatus',
        tags: ['Favorites'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Status', ...json(ref('FavoriteStatusResponse')) },
          ...err,
        },
      },
    },
    '/favorites': {
      get: {
        operationId: 'getFavorites',
        tags: ['Favorites'],
        security: bearer,
        parameters: pageQuery,
        responses: { '200': { description: 'List', ...json(ref('SnippetListResponse')) }, ...err },
      },
    },
    '/comments/{snippetId}': {
      get: {
        operationId: 'getComments',
        tags: ['Comments'],
        security: bearer,
        parameters: [
          { name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } },
          ...pageQuery,
        ],
        responses: { '200': { description: 'List', ...json(ref('CommentListResponse')) }, ...err },
      },
      post: {
        operationId: 'createComment',
        tags: ['Comments'],
        security: bearer,
        parameters: [{ name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          ...json({ type: 'object', properties: { content: { type: 'string' } } }),
        },
        responses: { '201': { description: 'Created', ...json(ref('CommentResponse')) }, ...err },
      },
    },
    '/comments/{commentId}': {
      put: {
        operationId: 'updateComment',
        tags: ['Comments'],
        security: bearer,
        parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          ...json({ type: 'object', properties: { content: { type: 'string' } } }),
        },
        responses: { '200': { description: 'Updated', ...json(ref('CommentResponse')) }, ...err },
      },
      delete: {
        operationId: 'deleteComment',
        tags: ['Comments'],
        security: bearer,
        parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deleted' }, ...err },
      },
    },
    '/collections': {
      post: {
        operationId: 'createCollection',
        tags: ['Collection'],
        security: bearer,
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isPrivate: { type: 'boolean' },
            },
          }),
        },
        responses: { '201': { description: 'Created', ...json(ref('CollectionResponse')) }, ...err },
      },
    },
    '/collections/me': {
      get: {
        operationId: 'getMyCollections',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          ...pageQuery,
          { name: 'snippetId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Mine', ...json(ref('CollectionListResponse')) },
          ...err,
        },
      },
    },
    '/collections/user/{userName}': {
      get: {
        operationId: 'getUserCollections',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          { name: 'userName', in: 'path', required: true, schema: { type: 'string' } },
          ...pageQuery,
        ],
        responses: {
          '200': { description: 'User collections', ...json(ref('CollectionListResponse')) },
          ...err,
        },
      },
    },
    '/collections/{shortId}': {
      get: {
        operationId: 'getCollection',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          { name: 'shortId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'One', ...json(ref('CollectionResponse')) }, ...err },
      },
    },
    '/collections/{collectionId}': {
      put: {
        operationId: 'updateCollection',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          { name: 'collectionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isPrivate: { type: 'boolean' },
            },
          }),
        },
        responses: { '200': { description: 'Updated', ...json(ref('CollectionResponse')) }, ...err },
      },
      delete: {
        operationId: 'deleteCollection',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          { name: 'collectionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '204': { description: 'Deleted' }, ...err },
      },
    },
    '/collections/{collectionId}/snippets': {
      post: {
        operationId: 'addSnippetToCollection',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          { name: 'collectionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          ...json({ type: 'object', properties: { snippetId: { type: 'string' } } }),
        },
        responses: { '200': { description: 'Added', ...json(ref('CollectionResponse')) }, ...err },
      },
    },
    '/collections/{collectionId}/snippets/{snippetId}': {
      delete: {
        operationId: 'removeSnippetFromCollection',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          { name: 'collectionId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'snippetId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '204': { description: 'Removed' }, ...err },
      },
    },
    '/collections/{collectionId}/snippets/order': {
      put: {
        operationId: 'reorderCollectionSnippets',
        tags: ['Collection'],
        security: bearer,
        parameters: [
          { name: 'collectionId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            properties: { snippetIds: { type: 'array', items: { type: 'string' } } },
          }),
        },
        responses: { '200': { description: 'Reordered', ...json(ref('CollectionResponse')) }, ...err },
      },
    },
    '/assets': {
      get: {
        operationId: 'listAssets',
        tags: ['Asset'],
        security: bearer,
        parameters: pageQuery,
        responses: { '200': { description: 'List', ...json(ref('AssetListResponse')) }, ...err },
      },
      post: {
        operationId: 'uploadAsset',
        tags: ['Asset'],
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  subFolder: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Uploaded', ...json(ref('AssetResponse')) }, ...err },
      },
    },
    '/assets/{assetId}': {
      delete: {
        operationId: 'deleteAsset',
        tags: ['Asset'],
        security: bearer,
        parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deleted' }, ...err },
      },
    },
  },
};
