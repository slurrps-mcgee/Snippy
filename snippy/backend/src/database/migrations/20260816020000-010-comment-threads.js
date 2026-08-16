'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('comments', 'parent_comment_id', {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
      references: { model: 'comments', key: 'comment_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('comments', 'mentions', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('comments', 'is_deleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addIndex('comments', ['parent_comment_id'], {
      name: 'idx_comments_parent',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('comments', 'idx_comments_parent');
    await queryInterface.removeColumn('comments', 'is_deleted');
    await queryInterface.removeColumn('comments', 'mentions');
    await queryInterface.removeColumn('comments', 'parent_comment_id');
  },
};
