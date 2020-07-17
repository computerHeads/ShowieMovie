var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'classmysql.engr.oregonstate.edu',
  user: 'cs340_jungan',
  password: '7505',
  database: 'cs340_jungan'
});

module.exports.pool = pool;
