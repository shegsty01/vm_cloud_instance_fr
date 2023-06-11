'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        Transaction.belongsTo(models.Profile)
    }
  }
  Transaction.init({
    from: DataTypes.INTEGER,
    type: DataTypes.STRING,
    //email: DataTypes.STRING,
    amount:{
        type:DataTypes.DECIMAL(10,2),
        defaultValue:0
    }

    // UserID: DataTypes.STRING
    //monthly_price
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};