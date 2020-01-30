'user strict';
var sql = require('./db.js');
var multer = require('multer');
const upload = multer({dest: __dirname + '/uploads'});
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

Task.deleteUser = function(input, req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    sql.query("DELETE FROM prosumers WHERE id = '" + input + "'", function (err, res) {  
                        if (err){
                            result(err, null);
                        }
                        else{
                            sql.query("DELETE FROM users WHERE id = '" + input + "'", function (err, res) {  
                                if (err){
                                    result(err, null);
                                }
                                else{
                                    result(null, "success");
                                }
                            });
                        }
                    });
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.getDashboardProsumer = function (req, result) {
    //Check for if the userid actually has a prosumer set up
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT * FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                sql.query("SELECT * FROM market ", function (err, res2) {  
                    if (err){
                        result (err, null);
                    }
                    else{
                        //let prosumer = JSON.stringify(res);

                        let newArray = res.concat(res2);
                        result(null, JSON.stringify(newArray));
                    }
                });
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
                    sql.query("INSERT INTO users VALUES (null, '" + newUser.username + "', '" + hash  + "', '0') ", function (err, res) {
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

Task.createUserAndProsumer = function (input, result) {
    var newUser = JSON.parse(input);

    sql.query("SELECT username FROM users WHERE username='" + newUser.username + "' ", function (err, res) {
        if (err){
            console.log(err);
            result(err, null);
        }

        else{
            if (res.length == 0){
                bcrypt.hash(newUser.password, saltRounds, function (err, hash){
                    sql.query("INSERT INTO users VALUES (null, '" + newUser.username + "', '" + hash  + "', '0') ", function (err, res) {
                        if (err){
                            console.log(err);
                            result(err, null);
                        }
                        else{
                            let id = res.insertId;
                            sql.query("SELECT * FROM prosumers WHERE id = '" + id + "'", function (err, res2) {  
                                if (err){
                                    result(err, null);
                                }
                                else{
                                    if (res2.length == 0){
                                        var producer = 0;
                
                                        if (newUser.producer == true){
                                            producer = 1;
                                        }
                
                                        if (newUser.battery < 0){
                                            result("invalidBattery", null);
                                        }
                
                                        else if (newUser.shareToMarket > 100 || newUser.shareToMarket < 0){
                                            result("invalidShareToMarket", null);
                                        }
                
                                        else if (newUser.marketSharePurchase > 100 || newUser.marketSharePurchase < 0){
                                            result("invalidMarketSharePurchase", null);
                                        }
                
                                        else{
                                            sql.query("INSERT INTO prosumers VALUES ('" + id + "', 0, '" + newUser.batteryCapacity + "', '0', '0', '0', '" + newUser.shareToMarket + "', '" + newUser.marketSharePurchase + "', '0', '0', '" + producer + "', null, null, null, null) ", function (err, res3) {
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
                            req.session.userid = res[0].id;
                            //console.log("Correct password");
                            if (res[0].manager == "1"){
                                result(null, "manager");
                            }
                            else{
                                result(null, "user");
                            }
                        }
                        else{
                            //console.log("Incorrect password");
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



Task.updateProsumer = function (input, req, result) {
    if (req.session.userid){
        let id = req.session.userid;
        var newProsumer = JSON.parse(input);
        var producer = 0;

        if (newProsumer.producer == true){
            producer = 1;
        }

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
            sql.query("UPDATE prosumers SET producer='" + producer + "', batteryCapacity='" + newProsumer.batteryCapacity + "', shareToMarket='" + newProsumer.shareToMarket + "', marketSharePurchase='" + newProsumer.marketSharePurchase + "' WHERE id='" + id + "' ", function (err, res) {
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
        result(null, "loggedout");
    }
};

Task.startPowerplant = function (req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    sql.query("UPDATE prosumers SET powerplantStatus='starting' WHERE id = '" + id + "'", function (err, res) {  
                        if (err){
                            result(err, null);
                        }
                        else{
                            result(null, "success");
                            setTimeout(function () {
                                sql.query("SELECT powerplantStatus FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
                                    if (err){
                                        console.log(err);
                                    }
                                    else{
                                        if (res[0].powerplantStatus == "starting"){
                                            sql.query("UPDATE prosumers SET powerplantStatus='running' WHERE id = '" + id + "'", function (err, res) {  
                                                //console.log("Powerplant running");
                                            });
                                        }
                                    }
                                });
                            }, 30000);
                        }
                    });
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.stopPowerplant = function (req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    sql.query("UPDATE prosumers SET powerplantStatus='stopped' WHERE id = '" + id + "'", function (err, res) {  
                        if (err){
                            result(err, null);
                        }
                        else{
                            result(null, "success");
                        }
                    });
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.updateCredentials = function (input, req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    let newCredentials = JSON.parse(input);
                    //console.log(newCredentials);
                    if (newCredentials.username.length > 1 && newCredentials.password.length > 1){
                        //update both
                        sql.query("SELECT username FROM users WHERE username = '" + newCredentials.username + "'", function (err, res2) {
                            if (res2.length > 0){
                                result(null, "usernameTaken");
                            }
                            else{
                                bcrypt.hash(newCredentials.password, saltRounds, function (err, hash){
                                    sql.query("UPDATE users SET username='" + newCredentials.username + "', password='" + hash + "' WHERE id = '" + newCredentials.id + "'", function (err, res) {  
                                        if (err){
                                            result(err, null);
                                        }
                                        else{
                                            result(null, "success");
                                        }
                                    });
                                });
                            }
                        });
                    }

                    else if (newCredentials.username.length > 1){
                        //update username
                        sql.query("SELECT username FROM users WHERE username = '" + newCredentials.username + "'", function (err, res2) {
                            if (res2.length > 0){
                                result(null, "usernameTaken");
                            }
                            else{
                                sql.query("UPDATE users SET username='" + newCredentials.username + "' WHERE id = '" + newCredentials.id + "'", function (err, res) {  
                                    if (err){
                                        result(err, null);
                                    }
                                    else{
                                        result(null, "success");
                                    }
                                });
                            }
                        });
                    }

                    else if (newCredentials.password.length > 1){
                        //update pw
                        bcrypt.hash(newCredentials.password, saltRounds, function (err, hash){
                            sql.query("UPDATE users SET password='" + hash + "' WHERE id = '" + newCredentials.id + "'", function (err, res) {  
                                if (err){
                                    result(err, null);
                                }
                                else{
                                    result(null, "success");
                                }
                            });
                        });
                    }
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.useCustomPrice = function (input, req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    if (input == "checked"){
                        sql.query("UPDATE market SET useCustomPrice='1' ", function (err, res) {  
                            if (err){
                                result(err, null);
                            }
                            else{
                                result(null, "success");
                            }
                        });
                    }
                    else if (input == "unchecked"){
                        sql.query("UPDATE market SET useCustomPrice='0' ", function (err, res) {  
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
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.setCustomPrice = function (input, req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    if (input < 0 || input > 9999.99){
                        result(err, "invalidInput");
                    }

                    else {
                        sql.query("UPDATE market SET customPrice='" + input + "' ", function (err, res) {  
                            if (err){
                                result(err, null);
                            }
                            else{
                                result(null, "success");
                            }
                        });
                    }
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.getBlackoutUsers = function (input, req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    sql.query("SELECT id FROM prosumers WHERE blackout='1' ", function (err, res2) {  
                        if (err){
                            result(err, null);
                        }
                        else if (res2.length < 1){
                            result(err, "noBlackouts");
                        }
                        else{
                            var blackouts = [];

                            //console.log(res2.length);

                            for(var i = 0; i < res2.length; i++){
                                if (i == 0){
                                    blackouts += "'" + res2[i].id + "'";
                                }
                                else{
                                    blackouts += ", '" + res2[i].id + "'";
                                }
                            }

                            sql.query("SELECT username FROM users WHERE id IN (" + blackouts + ") ", function (err, res3) { 
                                if (err){
                                    result(err, null);
                                }
                                else{
                                    result(err, JSON.stringify(res3));
                                }
                            });
                        }
                    });
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.uploadImage = function (req, result){
    if(req.file)
        console.log("req file found!");

    result(null, "default");
}

Task.blockFromMarket = function (input, req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    let inputValues = JSON.parse(input);

                    var currentTime = Date.now();
                    var blockUntil = currentTime + (inputValues.duration*1000);
                    //set blockvalue to currentime+input.time where id = input.id
                    sql.query("UPDATE prosumers SET marketBlockUntil='" + blockUntil + "' WHERE id = '" + inputValues.id + "'", function (err, res) {  
                        if (err){
                            result(err, null);
                        }
                        else{
                            result(err, "success");
                        }
                    });
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.getProsumerById = function (input, req, result) {
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    sql.query("SELECT * FROM prosumers WHERE id = '" + input + "'", function (err, res2) {  
                        if (err){
                            result(err, null);
                        }
                        else{
                            result(null, JSON.stringify(res2));
                        }
                    });
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }  
};

Task.getAllNormalUsers = function (req, result){
    if (req.session.userid){
        let id = req.session.userid;
        sql.query("SELECT manager FROM prosumers WHERE id = '" + id + "'", function (err, res) {  
            if (err){
                result(err, null);
            }
            else{
                if (res[0].manager == 1){
                    sql.query("SELECT id, username FROM users WHERE manager='0' ", function (err, res2) {  
                        if (err){
                            result(err, null);
                        }
                        else{
                            result(null, JSON.stringify(res2));
                        }
                    });
                }
                else{
                    result(err, "notManager");
                }
            }
        });
    }
    else{
        result(null, "loggedout");
    }
}

Task.getAllProsumers = function (result) {
    sql.query("Select * from prosumers", function (err, res) {
        if(err) {
            console.log("error: ", err);
            result(null, err);
        }

        else{
            //console.log('tasks : ', res);  
            result(null, res);
        }
    });   
};

module.exports = Task;
