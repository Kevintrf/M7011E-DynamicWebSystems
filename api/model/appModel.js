'user strict';
var sql = require('./db.js');

//Task object constructor
var Task = function(task){
    this.task = task.task;
    this.status = task.status;
    this.created_at = new Date();
};

Task.getProsumerInfo = function (id, result) {;
    sql.query("SELECT * FROM prosumers WHERE id = ? ", id, function (err, res) {  
        if (err){
            result(err, null);
        }
        else{
            result(null, res);
        }
    });
};

Task.insertUser = function (input, result) {
    const newUser = JSON.parse(input);
    sql.query("INSERT INTO users VALUES ('" + newUser.id + "','" + newUser.username + "','" + newUser.password + "') ", function (err, res) {
        if (err){
            result(err, null);
        }
        else{
            result(null, res);
        }
    });
};

Task.insertProsumer = function (id, result) {
    sql.query("INSERT INTO prosumers VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, false, true) ", id, function (err, res) {
        if (err){
            result(err, null);
        }
        else{
            result(null, res);
        }
    });
};

Task.getProsumerById = function (id, result) {
    sql.query("SELECT * FROM prosumers WHERE id = ? ", id, function (err, res) {             
        if(err) {
            console.log("error: ", err);
            result(err, null);
        }
        else{
            result(null, res);
        }
    });   
};

Task.getAllProsumers = function (result) {
    sql.query("Select * from prosumers", function (err, res) {
        if(err) {
            console.log("error: ", err);
            result(null, err);
        }

        else{
            console.log('tasks : ', res);  
            result(null, res);
        }
    });   
};

module.exports= Task;
