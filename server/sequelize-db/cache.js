const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  const Cache = sequelize.define(
    'Cache',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      schema: {
        type: DataTypes.JSON
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: 'cache',
      underscored: true,
      updatedAt: false
    }
  );

  return Cache;
};
