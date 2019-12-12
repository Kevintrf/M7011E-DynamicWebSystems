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
    powerCycle();
    sendToDatabase("SELECT count(*) as value FROM prosumers;", function(data){
        powerCycle(data[0].value);
    });
}

//Make these synchronous, every loop should also be synchronous, each loop should be done before the next loop starts
function powerCycle(userAmount){
    resetPowerAllProsumers();

    for (let i=1; i<userAmount+1; i++){
        generatePower(i);
    }

    for (let i=1; i<userAmount+1; i++){
        handleExcessPower(i);
    }

    for (let i=1; i<userAmount+1; i++){
        handleMissingPower(i);
    }

    for (let i=1; i<userAmount+1; i++){
        checkBlackout(i);
    }
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

//Behöver förbättras
function currentMarketPrice(){
    //getTotalConsumption does not exist yet
    let marketPrice = getTotalConsumption()/currentWindSpeed();
    return marketPrice;
}

function sendToDatabase(sql, callback){
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

//funkar
function resetPowerAllProsumers(){
    sendToDatabase("UPDATE prosumers SET power=0, blackout=0;", function(){
        console.log("Power and blackout states of all prosumers have been reset")
    });
}

//Funkar
function generatePower(id){
    let power = parseFloat((currentWindSpeed() * 0.2) - currrentConsumption());

    sendToDatabase("UPDATE prosumers SET power =" + power + " WHERE id=" + id + ";", function(){
        console.log("Updated power of user " + id + " to " + power);
    });
}

function handleExcessPower(id){
    sendToDatabase("SELECT power, shareToMarket FROM prosumers WHERE id=" + id + ";", function(prosumerData){
        let power = prosumerData[0].power;

        if (power > 0){
            let percentageToMarket = prosumerData[0].shareToMarket*0.01;
            sendToMarket(id, power*percentageToMarket);
            sendToBattery(id, power*(1-percentageToMarket));
        }
    });
}

function handleMissingPower(id){
    sendToDatabase("SELECT power, marketSharePurchase FROM prosumers WHERE id=" + id + ";", function(prosumerData){
        let power = prosumerData[0].power;

        if (power < 0){
            let percentageFromMarket = prosumerData[0].marketSharePurchase*0.01;
            getFromMarket(id, power*percentageFromMarket);
            getFromBattery(id, power*(1-percentageFromMarket));
            
            
            //Some asyncronous waiting fix, this code should only be run after the market and battery queries are completed
            //Tries to get all the power from market/battery, to avoid blackout, only happens if market/battery did not have enough
            //Maybe should only be run if some setting in user interface allows it?
            /*
            sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                let power = prosumerData[0].power;
                getFromBattery(id, power);
                //async and wait
                sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                    let power = prosumerData[0].power;
                    getFromMarket(id, power);
                });
            });*/
        }
    });
}

//funkar som den ska
//Blackout value (bit) in sql needs to be accessed as "SELECT blackout+0 FROM prosumers;", 
//the +0 converts it to an integer otherwise it prints a literal bit (which will break stuff)
function checkBlackout(id){
    sendToDatabase("SELECT power FROM prosumers where id=" + id +";", function(prosumerData){
        let power = prosumerData[0].power;
        if (power < 0){
            sendToDatabase("UPDATE prosumers SET blackout=1 WHERE id=" + id + ";", function(){
                console.log("User " + id + " has experienced a blackout");
            });
        }
    });
}

//---OBSELETE, ersatt av handleExcessPower och handleMissingPower------
//funkar,
function powerManagement(id){
    sendToDatabase("SELECT power, shareToMarket, marketSharePurchase FROM prosumers WHERE id=" + id + ";", function(prosumerData){
        let power = prosumerData[0].power;

        if (power > 0){
            let percentageToMarket = prosumerData[0].shareToMarket*0.01;
            sendToMarket(id, power*percentageToMarket);
            sendToBattery(id, power*(1-percentageToMarket));
        }

        else if (power < 0){
            let percentageFromMarket = prosumerData[0].marketSharePurchase*0.01;
            getFromMarket(id, power*percentageFromMarket);
            getFromBattery(id, power*(1-percentageFromMarket));
            
            
            //Some asyncronous waiting fix, this code should only be run after the market and battery queries are completed
            //Tries to get all the power from market/battery, to avoid blackout, only happens if market/battery did not have enough
            //Maybe should only be run if some setting in user interface allows it?
            /*
            sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                let power = prosumerData[0].power;
                getFromBattery(id, power);
                //async and wait
                sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                    let power = prosumerData[0].power;
                    getFromMarket(id, power);
                });
            });*/
        }
    });
}
