const {
    Sequelize
  } = require('sequelize');
 const sequelize = new Sequelize('uhsoka_master', 'shegsty', '0544129835qQ', {
    dialect: 'mysql',
    host:"127.0.0.1",
    
  });

sequelize.getQueryInterface().showAllSchemas().then((tableObj) => {
    console.log('// Tables in database','=========================nina hartley=');
    console.log(tableObj);
})
.catch((err) => {
    console.log('showAllSchemas ERROR',err);
})