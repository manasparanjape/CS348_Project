const Sequelize = require('sequelize');

const sequelize = new Sequelize('library', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
