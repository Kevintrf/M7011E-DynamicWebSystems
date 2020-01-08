'user strict';

var mysql = require('mysql');

//local mysql db connection
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'piedpiper',
    password : 'piedpiper',
    database : 'node'
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;
