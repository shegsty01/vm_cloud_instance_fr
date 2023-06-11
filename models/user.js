'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require("bcrypt")

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      //getposts
      User.hasMany(models.Posts)
      //getAlerts
      User.hasMany(models.Alert)
      //messages
      User.hasOne(models.Message)
      //subscribers
      User.belongsToMany(models.Profile,{through:"user_profile"})
      //getprofilestats
      User.hasOne(models.Profile)
      //paiduser
      User.belongsToMany(models.Posts,{through:"user_post"})
      //bundle pivot
      User.belongsToMany(models.Bundles,{through:"user_bundle"})
    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    mtn_number: DataTypes.STRING,
    referrer: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  User.beforeCreate((user, options)=>{
    return bcrypt.hash(user.password, 10)
        .then(hash => {
            user.password = hash;
        })
        .catch(err => { 
            throw new Error(); 
        });
    
  })
  User.beforeUpdate((user, options)=>{
    if(user.password){
      return bcrypt.hash(user.password, 10)
        .then(hash => {
            user.password = hash;
        })
        .catch(err => { 
            throw new Error(); 
        });
      


    }
  })
  User.validPassword = async (password, hash, options)=>{
    return  await bcrypt.compare(password, hash) 

  }
  return User;
};