'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn('snippets', 'externalResources', 'cdnResources');
  },

  async down(queryInterface) {
    await queryInterface.renameColumn('snippets', 'cdnResources', 'externalResources');
  },
};
