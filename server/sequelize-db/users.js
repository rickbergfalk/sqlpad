const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  const Users = sequelize.define(
    'Users',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: true
        }
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isLowercase: true,
          isIn: [['admin', 'editor', 'viewer']]
        }
      },
      name: {
        type: DataTypes.STRING
      },
      passhash: {
        type: DataTypes.STRING
      },
      passwordResetId: {
        type: DataTypes.UUID
      },
      data: {
        type: DataTypes.JSON
      },
      signupAt: {
        type: DataTypes.DATE
      },
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: 'users',
      underscored: true
    }
  );

  return Users;
};
