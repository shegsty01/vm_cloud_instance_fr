'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bundles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Bundles.belongsTo(models.Profile)
      //pivot bundles and users
      Bundles.belongsToMany(models.User,{through:"user_bundle"})
    }
  }
  Bundles.init({
    endDate: DataTypes.INTEGER,
    price:{
      type:DataTypes.DECIMAL(10,2),
      defaultValue:0
    },
  }, {
    sequelize,
    modelName: 'Bundles',
  });
  return Bundles;
};