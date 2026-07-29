'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('snippet_views', {
      snippet_view_id: {
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
      auth0_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'auth0_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      last_viewed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('snippet_views', ['snippet_id', 'auth0_id'], {
      unique: true,
      name: 'idx_snippet_views_snippet_user',
    });
    await queryInterface.addIndex('snippet_views', ['auth0_id'], {
      name: 'idx_snippet_views_auth0',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('snippet_views');
  },
};
