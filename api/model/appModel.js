'user strict';
var sql = require('./db.js');
var bcrypt = require('bcrypt');
const saltRounds = 12; //Do not use a value lower than 12 for production code

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

Task.registerUser = function (input, result) {
    var login = JSON.parse(input);

    if ()

    bcrypt.hash(input.password, saltRounds, function (err, hash){
        console.log("Hash: " + hash);
        sql.query("INSERT INTO users VALUES ('" + newUser.id + "','" + newUser.username + "','" + hash  + "') ", function (err, res) {
            if (err){
                result(err, null);
            }
            else{
                //Res.redirect has to occur in appController.js the res in this function is not the same res we want to access
                result(null, res);
            }
        });
    });
};

Task.login = function (input, result) {
    var login = JSON.parse(input);
    sql.query("SELECT * FROM users WHERE username = '" + login.username + "' ", function (err, res) {
        if (err){
            result(err, null);
        }

        else{
            if (res.length == 1){
                bcrypt.compare(login.password, res[0].password, function (err, resultCompare) {
                    if (err){
                        result(err, null);
                    }
                    else{
                        if (resultCompare == true){
                            console.log("Correct password");
                            result(null, "correct");
                            //result(null, res.redirect('/home'));
                        }
                        else{
                            console.log("Incorrect password");
                            result(null, "incorrect");
                            //Incorrect password!
                        }
                    }
                });
            }

            else{
                //Incorrect username
                result(null, "incorrect");
                //Username not found, OR MULTIPLE USER FOUND!?! (should not happen! but username is unique in the database so this should be impossible)
            }
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
