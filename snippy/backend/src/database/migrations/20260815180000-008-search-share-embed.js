'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE snippets
      ADD COLUMN tags_text TEXT
      GENERATED ALWAYS AS (CAST(tags AS CHAR)) STORED
    `);

    await queryInterface.sequelize.query(`
      CREATE FULLTEXT INDEX idx_snippets_ft_search
      ON snippets (name, description, tags_text)
    `);

    await queryInterface.addColumn('snippets', 'share_token', {
      type: Sequelize.STRING(32),
      allowNull: true,
      unique: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('snippets', 'embed_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('snippets', 'embed_count');
    await queryInterface.removeColumn('snippets', 'share_token');
    await queryInterface.sequelize.query('DROP INDEX idx_snippets_ft_search ON snippets');
    await queryInterface.removeColumn('snippets', 'tags_text');
  },
};
