# ShowieMovie - A relational database website

## Description

A place where people can search for shows and movies that across different streaming platform. We used existing dataset found through IMDB, and kaggle.com to populate our database.

## Requirements

Create new file named dbcon.js in the scripts folder.

In scripts/dbcon.js,
const mysql = require("mysql");
const pool = mysql.createPool({
host: "",
user: "",
password: "",
database: ""
});
module.exports.pool = pool;
