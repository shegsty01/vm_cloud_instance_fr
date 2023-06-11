'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Posts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Posts.belongsTo(models.User)
      Posts.belongsToMany(models.User,{through:"user_post"})
      Posts.hasMany(models.Comments)
      Posts.hasMany(models.Favorites)
    }
  }
  Posts.init({
    title: DataTypes.STRING,
    file: DataTypes.STRING,
    //caption: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    price:{
      type:DataTypes.DECIMAL(10,2),
      defaultValue:0
    },
    caption:{
      type:DataTypes.STRING,
      defaultValue:""
  }
  }, {
    sequelize,
    modelName: 'Posts',
  });
  return Posts;
};