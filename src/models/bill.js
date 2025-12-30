const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Activity = require('./activity');

const Bill = sequelize.define(
  'Bill',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING(20),
    },
    paid_date: {
      type: DataTypes.DATE,
    },
    price: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    frequency: {
      type: DataTypes.STRING(20),
    },
  },
  {
    tableName: 'bill',
    timestamps: true,
  }
);

Bill.associate = (models) => {
  Bill.hasMany(models.Activity, {
    foreignKey: 'bill_id',
    as: 'activities',
  });
};

module.exports = Bill;