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

Task.checkSession = function (req, result){
    if (req.session.userid){
        result(null, "loggedin");
    }

    else{
        result(null, "loggedout");
    }
}

Task.logout = function (req, result){
    req.session.userid = null;
    result(null, "success");
}

Task.getMyProsumer = function (req, result) {

    //Check for if the userid actually has a prosumer set up


    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT * FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                let prosumer = JSON.stringify(res);
                result(null, prosumer);
            }
        });
    }

    else{
        result(null, "loggedout");
    }
};

Task.getProsumerInfo = function (id, result) {
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
    var newUser = JSON.parse(input);

    sql.query("SELECT username FROM users WHERE username='" + newUser.username + "' ", function (err, res) {
        if (err){
            console.log(err);
            result(err, null);
        }

        else{
            if (res.length == 0){
                bcrypt.hash(newUser.password, saltRounds, function (err, hash){
                    sql.query("INSERT INTO users VALUES (null, '" + newUser.username + "', '" + hash  + "') ", function (err, res) {
                        if (err){
                            console.log(err);
                            result(err, null);
                        }
                        else{
                            result(null, "success");
                        }
                    });
                });
            }
            
            else{
                result(null, "usernameTaken");
            }
        }
    });
};

Task.login = function (input, req, result) {
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
                            req.session.userid = res[0].id;
                            result(null, "correct");
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

Task.createProsumer = function (input, req, result) {
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT * FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res.length == 0){
                    var newProsumer = JSON.parse(input);

                    if (input.battery < 0){
                        result("invalidBattery", null);
                    }

                    else if (input.shareToMarket > 100 || input.shareToMarket < 0){
                        result("invalidShareToMarket", null);
                    }

                    else if (input.marketSharePurchase > 100 || input.marketSharePurchase < 0){
                        result("invalidMarketSharePurchase", null);
                    }

                    else{
                        sql.query("INSERT INTO prosumers VALUES ('" + id + "', 0, '" + newProsumer.batteryCapacity + "', 0, 0, 0, '" + newProsumer.shareToMarket + "', '" + newProsumer.marketSharePurchase + "', 0, false, " + newProsumer.producer + ", null) ", function (err, res) {
                            if (err){
                                console.log(err);
                                result(err, null);
                            }
                            else{
                                result(null, "success");
                            }
                        });
                    }
                }
                
                else{
                    result(null, "alreadyExists");
                }
            }
        });
    }

    else{
        result(null, "loggedout");
    }
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

module.exports = Task;
