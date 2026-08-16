'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('snippets', 'parent_name', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('snippets', 'parent_user_name', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.sequelize.query(`
      UPDATE snippets child
      INNER JOIN snippets parent ON parent.short_id = child.parent_snippet_short_id
      INNER JOIN users parent_user ON parent_user.auth0_id = parent.auth0_id
      SET child.parent_name = parent.name,
          child.parent_user_name = parent_user.user_name
      WHERE child.parent_snippet_short_id IS NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('snippets', 'parent_user_name');
    await queryInterface.removeColumn('snippets', 'parent_name');
  },
};
