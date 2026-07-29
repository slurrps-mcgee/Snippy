'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('collections', {
      collection_id: {
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
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('collections', ['auth0_id'], { name: 'idx_collections_auth0' });
    await queryInterface.addIndex('collections', ['auth0_id', 'is_private'], {
      name: 'idx_collections_auth0_private',
    });

    await queryInterface.createTable('collection_snippets', {
      collection_snippet_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      collection_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'collections', key: 'collection_id' },
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
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    await queryInterface.addIndex('collection_snippets', ['collection_id', 'snippet_id'], {
      unique: true,
      name: 'idx_collection_snippets_pair',
    });
    await queryInterface.addIndex('collection_snippets', ['collection_id'], {
      name: 'idx_collection_snippets_collection',
    });
    await queryInterface.addIndex('collection_snippets', ['snippet_id'], {
      name: 'idx_collection_snippets_snippet',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('collection_snippets');
    await queryInterface.dropTable('collections');
  },
};
