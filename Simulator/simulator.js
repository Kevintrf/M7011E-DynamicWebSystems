var mysql = require('mysql');
var createDist = require('distributions-normal');

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

//Runs function updateServer every second until stopFunction() is called
setInterval(function(){ updateServer() }, 1000);

function updateServer() {
    sendToDatabase("SELECT count(*) as value FROM prosumers;", function(data){
        prosumerProduction(data[0].value);
    }); 
    
}

function currrentConsumption(){
    //Returns hourly usage of 
    var normal = createDist();

    normal.mean(11);
    normal.variance(3);

    //Divided by 24 to get hourly usage
    var output = (normal.inv([Math.random()])/24);
    return output;
}

function currentWindSpeed(){
    //Collect actual weather data instead of this
    var dailyMeanValue = 10; //Measured in knots

    var normal = createDist();

    normal.mean(dailyMeanValue);
    normal.variance(5);

    //Ändra i random så att det är mer sannolikt att få ett väldigt lågt värde? Vanligt att det blir vindstilla men inte att det typ blir storm
    var output = parseFloat(normal.inv([Math.random()]));
    return output;
}

function buyFromMarket(energy, user){

}

function sendToDatabase(sql, callback){
    var output;
    con.query(sql, function (err, result){
        if (err) throw err;
        callback(result);
    });
}



function sendToMarket(id, amount){

}

function getFromMarket(id, amount){
    return 0;
}

function getFromBattery(id, amount){
    return 0;
}

function sendToBattery(id, amount){
    sendToDatabase("SELECT battery, batteryCapacity FROM prosumers WHERE id=" + id + ";", function(data){
        console.log(id);
        var currentBattery = data[0].battery;
        var batteryCapacity =  data[0].batteryCapacity;
        
        //Automatically sell excess power?
        if (amount+currentBattery > batteryCapacity)
            sendToDatabase("UPDATE prosumers SET battery =" + batteryCapacity +  " WHERE id=" + id + ";", function(data){});
        else
            sendToDatabase("UPDATE prosumers SET battery =" + (amount+currentBattery) + " WHERE id=" + id + ";", function(data){});
    
    });
}

function currentMarketPrice(){
    return 5;
}

function prosumerProduction(prosumerCount){
    var power = 0;
    for (let i = 1; i < prosumerCount+1; i++){
        //In the future also add a check for if the prosumer actually has a wind turbine, boolean isProducer
        //Also check the decimal of the power column in the database, might need to support more/less numbers in the future
        power = parseFloat((currentWindSpeed() * 0.2) - currrentConsumption());

        sendToDatabase("UPDATE prosumers SET power =" + power + " WHERE id=" + i + ";", function(data){});
        console.log("Updated power of user " + i + " to " + power);
        if (power > 0){
            sendToDatabase("SELECT shareToMarket as value FROM prosumers WHERE id=" + i + ";", function(data){
                console.log(i);
                var percentageToMarket = data[0].value*0.01;
                sendToMarket(i, power*percentageToMarket);
                sendToBattery(i , power*(1-percentageToMarket));
            });
        }

        //This should be changed to it automatically can purchase more from the market if needed
        //the getFromMarket/Battery returns the value that you bought, if it is not enough something should be done
        //this is a design choice that needs to be addressed
        else if (power < 0){
            sendToDatabase("SELECT marketSharePurchase as value FROM prosumers WHERE id=" + i + ";", function(data){
                var percentageFromMarket = data[0].value*0.01;
                getFromMarket(i, power*percentageFromMarket);
                getFromBattery(i , power*(1-percentageFromMarket));
            });
        }

        if (power < 0)
            blackout(i);
    }
}

function blackout(id){

}