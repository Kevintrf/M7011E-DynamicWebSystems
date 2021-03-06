var mysql = require('mysql');
var createDist = require('distributions-normal');

var con = mysql.createConnection({
    host: "localhost",
    user: "piedpiper",
    password: "piedpiper"
});

con.connect(function(err) {
    if (err)
        throw err;
    console.log("Connected successfully");
    con.query("USE node;");
});

module.exports = {
    sendToDatabase: async function (sql, callback) {
        con.query(sql, async function (err, result){
            if (err) throw err;
            await callback(await result);
        });
    }
};




//---obselete----
function connect(dbname){
    con.connect(function(err) {
        if (err)
            throw err;
        console.log("Connected successfully");
        con.query("USE " + dbname + ";");
    });
}

function importDatabase(filename){
    sendToDatabase("SOURCE " + filename + ";", function(data){

    });
}


//---------------Obselete functions-----------

function selectDatabase(dbname){
    sendToDatabase("USE " + dbname, function(data){
        console.log("Database " + dbname + " selected");
    });
}

function dropDatabase(dbname){
    sendToDatabase("DROP DATABASE " + dbname, function(data){
        console.log("Database " + dbname + " created (Hope you didn't delete anything important)");
    });
}

function createDatabase(dbname){
    sendToDatabase("CREATE DATABSE " + dbname + ";", function(data){
        sendToDatabase("USE DB " + dbname + ";", function(data){
            sendToDatabase("CREATE TABLE prosumers(id int, battery decimal(10, 4), batteryCapacity decimal(10, 4), power decimal(10, 4), shareToMarket int, marketSharePurchase int, blackout boolean);", function(data){
                sendToDatabase("CREATE TABLE market(id int, power decimal(10, 4);", function(data){
                    console.log("Database " + dbname + " created");
                });
            });
        });
    });
}