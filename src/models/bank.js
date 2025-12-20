const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bank = sequelize.define(
  'Bank',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    primary_amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    secondary_amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    saving_amount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    saving_for: {
      type: DataTypes.STRING(20),
      defaultValue: "PRIMARY",
    },
  },
  {
    tableName: 'bank',
    timestamps: true,
  }
);

module.exports = Bank;