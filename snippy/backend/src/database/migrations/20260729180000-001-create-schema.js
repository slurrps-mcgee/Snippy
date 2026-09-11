'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      auth0_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      user_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      picture_url: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      is_admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('users', ['user_name'], { name: 'idx_users_username' });
    await queryInterface.addIndex('users', ['display_name'], { name: 'idx_users_display_name' });

    await queryInterface.createTable('snippets', {
      snippet_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      auth0_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'auth0_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      short_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parent_snippet_short_id: {
        type: Sequelize.STRING(16),
        allowNull: true,
        defaultValue: null,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      view_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      fork_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      favorite_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      comment_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      externalResources: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Match sequelize-typescript default: camelCase attribute without field: maps to externalResources column
    // Entity uses type: DataType.JSON without field override — Sequelize underscored is false, so column is externalResources
    await queryInterface.addIndex('snippets', ['auth0_id'], { name: 'idx_snippets_auth0' });
    await queryInterface.addIndex('snippets', ['short_id'], { name: 'idx_snippets_short_id' });
    await queryInterface.addIndex('snippets', ['parent_snippet_short_id'], {
      name: 'idx_snippets_parent',
    });
    await queryInterface.addIndex('snippets', ['view_count'], { name: 'idx_snippets_view_count' });
    await queryInterface.addIndex('snippets', ['fork_count'], { name: 'idx_snippets_fork_count' });
    await queryInterface.addIndex('snippets', ['favorite_count'], {
      name: 'idx_snippets_favorite_count',
    });
    await queryInterface.addIndex('snippets', ['auth0_id', 'is_private'], {
      name: 'idx_snippets_auth0_private',
    });
    await queryInterface.addIndex('snippets', ['is_private', 'created_at'], {
      name: 'idx_snippets_private_created',
    });
    await queryInterface.addIndex('snippets', ['name'], { name: 'idx_snippets_name_search' });
    await queryInterface.addIndex('snippets', ['description'], {
      name: 'idx_snippets_description_search',
    });

    await queryInterface.createTable('snippet_files', {
      snippet_file_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      snippet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'snippets', key: 'snippet_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      file_type: {
        type: Sequelize.ENUM('html', 'css', 'js'),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('snippet_files', ['snippet_id', 'file_type'], {
      unique: true,
      name: 'unique_snippet_file_type_per_snippet',
    });

    await queryInterface.createTable('comments', {
      comment_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      auth0_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'auth0_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      snippet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'snippets', key: 'snippet_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('comments', ['auth0_id'], { name: 'idx_comments_auth0' });
    await queryInterface.addIndex('comments', ['snippet_id'], { name: 'idx_comments_snippet' });
    await queryInterface.addIndex('comments', ['snippet_id', 'created_at'], {
      name: 'idx_comments_snippet_created',
    });

    await queryInterface.createTable('favorites', {
      favorite_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      auth0_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'auth0_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      snippet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'snippets', key: 'snippet_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('favorites', ['auth0_id'], { name: 'idx_favorites_auth0' });
    await queryInterface.addIndex('favorites', ['snippet_id'], { name: 'idx_favorites_snippet' });
    await queryInterface.addIndex('favorites', ['auth0_id', 'snippet_id'], {
      unique: true,
      name: 'idx_favorites_user_snippet',
    });

    await queryInterface.createTable('assets', {
      asset_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      auth0_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'auth0_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      object_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      file_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('assets', ['auth0_id', 'object_key'], {
      unique: true,
      name: 'idx_assets_auth0_object_key',
    });
    await queryInterface.addIndex('assets', ['auth0_id'], { name: 'idx_assets_auth0Id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('assets');
    await queryInterface.dropTable('favorites');
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('snippet_files');
    await queryInterface.dropTable('snippets');
    await queryInterface.dropTable('users');
  },
};
