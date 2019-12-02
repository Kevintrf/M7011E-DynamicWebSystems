var http = require('http');
var mysql = require('mysql');
var createDist = require('distributions-normal');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(testWeather());
    res.end("Goodbye world!");
}).listen(8080);

var con = mysql.createConnection({
    host: "localhost",
    user: "node",
    password: "node"
});

con.connect(function(err) {
    if (err)
        throw err;
    console.log("Connected successfully");
    con.query("USE node;")
});

function createUser(username, password){
    console.log("hej");
    var sql = "INSERT INTO users (username, password) VALUES ('" + username + "', '" + password + "');";
    sendToDatabase(sql);
}

function prosumerConsumption(){
    //Returns hourly usage of 
    var normal = createDist();

    normal.mean(11);
    normal.variance(3);

    //Divided by 24 to get hourly usage
    var output = (normal.inv([Math.random()])/24).toFixed(3);
    return output;
}

function currentWindSpeed(){
    //Collect actual weather data instead of this
    var dailyMeanValue = 10; //Measured in knots

    var normal = createDist();

    normal.mean(dailyMeanValue);
    normal.variance(5);

    //Ändra i random så att det är mer sannolikt att få ett väldigt lågt värde? Vanligt att det blir vindstilla men inte att det typ blir storm
    var output = parseFloat(normal.inv([Math.random()])).toFixed(3);
    return output;
}

/*
function prosumerConsumption(){
    //Returns hourly consumption (Between 2.5 and 3.5kWh) 3kWh is an hourly average of the real life statistical average of 25000kWh per year
    var powerConsumption = ((Math.floor(Math.random() * (350 - 250 + 1)) + 250)*0.01).toFixed(2);
    return powerConsumption;
}
*/

function consumePower(){
    //if consumption < production
        //shit
    //else take from battery if possible

    //else
        //buyFromMarket();
}

function buyFromMarket(energy, user){

}

function sendToDatabase(sql){
    con.query(sql, function (err, result){
        if (err) throw err;
        console.log("Query successfully sent to database");
    });
}


//Runs function updateServer every second until stopFunction() is called
let serverTick = setInterval(function(){ updateServer() }, 1000);

function updateServer() {
    testFunction();
    //createUser("user2", "pass");
    var prosumerCount;

    var sql = "SELECT COUNT(*) FROM prosumers;"
    con.query(sql, function (err, result){
        if (err) throw err;
        prosumerCount = result;
    });

    for (var i = 1; i < prosumerCount+1; i++){
        prosumerProduction(i);
    }
}

function prosumerProduction(id){

}

function stopServer() {
    clearInterval(serverTick);
}

function testFunction(){
    console.log("Hourly power usage: " + prosumerConsumption() + "kWh");
    console.log("Wind speed this hour: " + currentWindSpeed() + " knots");
    console.log("--------------");
}

function testWeather(){
    var weather = "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/22.177971/lat/65.589498/data.json";
    return weather;
}
