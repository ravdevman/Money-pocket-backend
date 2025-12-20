const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Bill = require('./bill');

const Activity = sequelize.define(
  'Activity',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
    },
    amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isBillPayment: {
      type: DataTypes.BOOLEAN,
    },
    bill_id: {
      type: DataTypes.INTEGER,
    },
  },
    {
    tableName: 'activity',
    timestamps: true,
  }
);

Activity.associate = (models) => {
  Activity.belongsTo(models.Bill, {
    foreignKey: 'bill_id',
    as: 'bill',
  });
};

module.exports = Activity;