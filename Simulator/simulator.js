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

//Runs function updateServer every second until stopFunction() is called
setInterval(function(){ updateServer() }, 1000);

function updateServer() {
    sendToMarket(2, 500);
    //sendToDatabase("SELECT count(*) as value FROM prosumers;", function(data){
    //    prosumerProduction(data[0].value);
    //});
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

function sendToDatabase(sql, callback){
    var output;
    con.query(sql, function (err, result){
        if (err) throw err;
        callback(result);
    });
}

//funkar som den ska
function sendToMarket(id, amount){
    //Add to check if id already exists, the same id should never be able to send something twice (since the table is emptied every cycle), what to do if it does?
    sendToDatabase("DELETE FROM market WHERE id=" + id + ";", function(){
        sendToDatabase("INSERT INTO market VALUES(" + id + ", " + amount + ");", function(){
            console.log("User " + id + " sent " + amount + " power to market");
        });
    });
}

//Funkar som den ska, kan fucka om flera kör nära inpå utan async/promises eller liknande
function getFromMarket(id, amount){
    //Avoids negative values
    if (amount < 0)
        amount = amount * -1;

    sendToDatabase("SELECT * FROM market WHERE power!=0;", function(marketData){
        if (marketData[0] != undefined){
            let availablePower = marketData[0].power;
            if (availablePower >= amount){
                let excess = availablePower-amount;
                sendToDatabase("UPDATE market SET power =" + excess + " WHERE id=" + marketData[0].id + ";", function(){
                    sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                        let newPower = prosumerData[0].power + amount;
                        sendToDatabase("UPDATE prosumers SET power=" + newPower + " WHERE ID=" + id +";", function(){
                            console.log("User " + id + " bought " + amount + " power from market");
                        });
                    });
                });
            }

            else{
                sendToDatabase("DELETE FROM market WHERE id=" + marketData[0].id + ";", function(){
                    sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                        let newPower = prosumerData[0].power + availablePower;
                        sendToDatabase("UPDATE prosumers SET power=" + newPower + " WHERE ID=" + id +";", function(){
                            console.log("User " + id + " bought " + availablePower + " power from market (not enough to fulfill user demand)");
                            getFromMarket(id, amount-availablePower);
                        });
                    });
                });
            }
        }

        else{
            //Finns ingen energi på market, returna något fint om det?
            console.log("Market empty");
        }
    });
}

//Funkar som den ska, kan fucka om flera kör nära inpå utan async/promises eller liknande
function getFromBattery(id, amount){
    //Avoids negative values
    if (amount < 0)
        amount = amount * -1;
    
    sendToDatabase("SELECT battery, power FROM prosumers WHERE id="+ id + ";", function(data){
        let availablePower = data[0].battery;
        if (availablePower >= amount){
            let newBattery = availablePower-amount;
            let newPower = data[0].power + amount;
            sendToDatabase("UPDATE prosumers SET battery=" + newBattery + ", power=" + newPower + " WHERE id=" + id + ";", function(){
                console.log("User " + id + " took " + amount + " power from battery");
            });
        }

        else{
            let newPower = data[0].power + availablePower;
            sendToDatabase("UPDATE prosumers SET battery=0, power=" + newPower + " WHERE id=" + id + ";", function (){
                console.log("User " + id + " took " + availablePower + " power from battery (not enough to fulfill user demand)");
                //Return that we didnt get enough power from the battery
            });
        }
    });
}

//Funkar som den ska
function sendToBattery(id, amount){
    sendToDatabase("SELECT battery, batteryCapacity FROM prosumers WHERE id=" + id + ";", function(data){
        let currentBattery = data[0].battery;
        let batteryCapacity =  data[0].batteryCapacity;
        
        //Automatically sell excess power?
        if (amount+currentBattery > batteryCapacity)
            sendToDatabase("UPDATE prosumers SET battery =" + batteryCapacity +  " WHERE id=" + id + ";", function(){
                console.log("Battery of user " + id + " set to " + batteryCapacity);
            });
        else
            sendToDatabase("UPDATE prosumers SET battery =" + (amount+currentBattery) + " WHERE id=" + id + ";", function(){
                console.log("Battery of user " + id + " set to " + (amount+currentBattery));
            });
    
    });
}

function currentMarketPrice(){
    //getTotalConsumption does not exist yet
    let marketPrice = getTotalConsumption()/currentWindSpeed();
    return marketPrice;
}

//Tror loopen skapar/kan skapa problem, lös på ett bättre sätt. Nestla allt i en stor eller fixa promises/async
function prosumerProduction(prosumerCount){
    var power = 0;
    for (let i = 1; i < 2; i++){//i < prosumerCount+1; i++){
        //In the future also add a check for if the prosumer actually has a wind turbine, boolean isProducer
        //Also check the decimal of the power column in the database, might need to support more/less numbers in the future
        power = parseFloat((currentWindSpeed() * 0.2) - currrentConsumption());

        sendToDatabase("UPDATE prosumers SET power =" + power + " WHERE id=" + i + ";", function(data){});
        console.log("Updated power of user " + i + " to " + power);
        if (power > 0){
            sendToDatabase("SELECT shareToMarket as value FROM prosumers WHERE id=" + i + ";", function(data){
                var percentageToMarket = data[0].value*0.01;
                sendToMarket(i, power*percentageToMarket);
                sendToBattery(i, power*(1-percentageToMarket));
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

        //if (power < 0)
            //blackout(i);
    }
}

function blackout(id){

}