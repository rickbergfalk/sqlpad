const Sequelize = require('sequelize');
const migrationUtils = require('../lib/migration-utils');

/**
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('../lib/config')} config
 * @param {import('../lib/logger')} appLog
 * @param {object} nedb - collection of nedb objects created in /lib/db.js
 * @param {object} sequelizeDb - sequelize instance
 */
// eslint-disable-next-line no-unused-vars
async function up(queryInterface, config, appLog, nedb, sequelizeDb) {
  await queryInterface.removeConstraint('users', 'users_password_reset_id');

  await migrationUtils.addOrReplaceIndex(
    queryInterface,
    'users',
    'users_password_reset_id',
    ['password_reset_id'],
    {
      unique: true,
      where: {
        password_reset_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    }
  );
}

module.exports = {
  up,
};
