'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      //bundles
      Profile.hasMany(models.Bundles)
      //transactions
      Profile.hasMany(models.Transaction)
      //subscribers
      Profile.belongsToMany(models.User,{through:"user_profile"})
      //has a user
      Profile.belongsTo(models.User)
    }
  }
  Profile.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    email: DataTypes.STRING,
    photo:DataTypes.STRING,
    price:DataTypes.DECIMAL(10,2),
    earnings:{
      type:DataTypes.DECIMAL(10,2),
      defaultValue:0.00

    }

    // UserID: DataTypes.STRING
    //monthly_price
  }, {
    sequelize,
    modelName: 'Profile',
  });
  return Profile;
};