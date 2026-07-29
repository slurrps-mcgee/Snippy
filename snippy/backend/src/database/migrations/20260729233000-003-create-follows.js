'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('follows', {
      follow_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      follower_auth0_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'auth0_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      following_auth0_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'users', key: 'auth0_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('follows', ['follower_auth0_id', 'following_auth0_id'], {
      unique: true,
      name: 'idx_follows_pair',
    });
    await queryInterface.addIndex('follows', ['follower_auth0_id'], {
      name: 'idx_follows_follower',
    });
    await queryInterface.addIndex('follows', ['following_auth0_id'], {
      name: 'idx_follows_following',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('follows');
  },
};
