var createDist = require('distributions-normal');
var db = require('./database'); 

var market = 0;
var marketPriceMultiplier = 100;
var marketPrice = 0;

//Runs the program every second
setInterval(async function(){
    await updateProsumersFromDatabase();
}, 1000);

async function updateProsumersFromDatabase(){
    try {
        await db.sendToDatabase("SELECT * FROM prosumers;", async function(data){
            var prosumerList = data;
            var marketSupply = 0;
            var marketDemand = 0;

            prosumerList.forEach(function(item, index) {
                generatePower(index, prosumerList, market);
            });

            prosumerList.forEach(function(item, index) {
                if (prosumerList[index].manager == 1 && prosumerList[index].powerplantStatus != "running"){
                    marketSupply += prosumerList[index].battery;
                }

                if (prosumerList[index].power > 0){
                    marketSupply += prosumerList[index].power;
                }

                else if (prosumerList[index].power < 0){
                    marketDemand += (prosumerList[index].power * -1);
                }
            });

            if (marketSupply == 0 || marketDemand == 0){
                marketPrice = null;
            }
            else{
                marketPrice = (marketDemand/marketSupply)*marketPriceMultiplier;
            }

            prosumerList.forEach(function(item, index) {
                handleExcessPower(index, prosumerList);
            });

            prosumerList.forEach(function(item, index) {
                handleMissingPower(index, prosumerList);
            });

            prosumerList.forEach(function(item, index) {
                if (prosumerList[index].manager == 1){
                    if (market > 0){
                        console.log("Adding excess market power to manager battery")
                        prosumerList[index].battery += market;
                        if (prosumerList[index].battery > prosumerList[index].batteryCapacity){
                            prosumerList[index].battery = prosumerList[index].batteryCapacity;
                        }
                    }
                }
            });

            market = 0;

            prosumerList.forEach(function(item, index) {
                checkBlackout(index, prosumerList);
            });

            prosumerList.forEach(function(item, index) {
                updateDatabaseProsumerEntry(index, prosumerList, marketPrice, marketSupply, marketDemand);
            });
        });
    }

    catch (e){
        console.log("Error in updateloop: " + e);
    }
}

//https://stackoverflow.com/questions/4205181/insert-into-a-mysql-table-or-update-if-exists for INSERT INTO or UPDATE IF EXIST
function updateDatabaseProsumerEntry(index, prosumerList, marketPrice, marketSupply, marketDemand){
    console.log("updating database for user " + index);

    //Kommer krasha om prosumern inte redan finns
    try{
        db.sendToDatabase("UPDATE prosumers SET battery =" + prosumerList[index].battery + 
        ", power=" + prosumerList[index].power + 
        ", production=" + prosumerList[index].production + 
        ", consumption =" + prosumerList[index].consumption + 
        ", blackout=" + prosumerList[index].blackout + 
        ", date=" + Date.now() + 
        ", wind=" + prosumerList[index].wind +
        " WHERE id=" + prosumerList[index].id, function(data){
            console.log("Database entry updated for user " + index);
        });
    }

    catch (e){
        console.log("Error updating database: " + e);
    }

    //Uppdaterar ALLA möjliga entries i market
    try{
        if (marketPrice == null){
            db.sendToDatabase("UPDATE market SET demand =" + marketDemand + 
        ", supply=" + marketSupply, function(data){
            console.log("Database entry updated for market " + index);
        });
        }
        else{
            db.sendToDatabase("UPDATE market SET demand =" + marketDemand + 
        ", supply=" + marketSupply + 
        ", modelPrice=" + marketPrice, function(data){
            console.log("Database entry updated for market " + index);
        });
        }
    }

    catch (e){
        console.log("Error updating database: " + e);
    }
}

function currentConsumption(){
    //Returns hourly usage of 
    var normal = createDist();

    normal.mean(11);
    normal.variance(3);

    //Divided by 24 to get hourly usage
    var output = (normal.inv([Math.random()]) / 24);
    return output;
}

function currentWindSpeed(){
    //Collect actual weather data instead of this
    var dailyMeanValue = 4; //Measured in knots

    var normal = createDist();

    normal.mean(dailyMeanValue);
    normal.variance(5);

    //Ändra i random så att det är mer sannolikt att få ett väldigt lågt värde? Vanligt att det blir vindstilla men inte att det typ blir storm
    var output = parseFloat(normal.inv([Math.random()]));

    //Wind cant be negative
    if (output < 0)
        output = 0;

    console.log("windspeed: " + output);
    return output;
}

//Behöver förbättras
function currentMarketPrice(){
    //getTotalConsumption does not exist yet
    let marketPrice = getTotalConsumption()/currentWindSpeed();
    return marketPrice;
}

//Funkar
function generatePower(index, prosumerList){
    if (prosumerList[index].manager == 0 && prosumerList[index].producer == 1){
        let windspeed = currentWindSpeed();
        let production = parseFloat(windspeed * 0.2);
        let consumption = currentConsumption();
        let power = production - consumption;

        prosumerList[index].wind = windspeed;
        prosumerList[index].production = production;
        prosumerList[index].consumption = consumption;
        prosumerList[index].power = power;
        console.log("User " + index + " production has been set to " + production);
        console.log("User " + index + " consumption has been set to " + consumption);
        console.log("User " + index + " power has been set to " + power);
    }
    else if (prosumerList[index].manager == 1){
        if (prosumerList[index].powerplantStatus == "running"){
            let windspeed = 0;
            let production = 5;
            let consumption = currentConsumption();
            let power = production - consumption;

            prosumerList[index].wind = windspeed;
            prosumerList[index].production = production;
            prosumerList[index].consumption = consumption;
            prosumerList[index].power = power;
            console.log("User " + index + " production has been set to " + production);
            console.log("User " + index + " consumption has been set to " + consumption);
            console.log("User " + index + " power has been set to " + power);
        }
        else{
            let windspeed = 0;
            let production = 0;
            let consumption = currentConsumption();
            let power = production - consumption;

            prosumerList[index].wind = windspeed;
            prosumerList[index].production = production;
            prosumerList[index].consumption = consumption;
            prosumerList[index].power = power;
            console.log("User " + index + " production has been set to " + production);
            console.log("User " + index + " consumption has been set to " + consumption);
            console.log("User " + index + " power has been set to " + power);
            console.log("No power generated (powerplant not running)");
        }
    }
    else{
        let windspeed = currentWindSpeed();
        let production = 0;
        let consumption = currentConsumption();
        let power = production - consumption;

        prosumerList[index].wind = windspeed;
        prosumerList[index].production = production;
        prosumerList[index].consumption = consumption;
        prosumerList[index].power = power;
        console.log("User " + index + " production has been set to " + production);
        console.log("User " + index + " consumption has been set to " + consumption);
        console.log("User " + index + " power has been set to " + power);
        console.log("No power generated (is not a producer)");
    }
}

function handleExcessPower(index, prosumerList, manager){
    if (prosumerList[index].power > 0){
        if (prosumerList[index].marketBlockUntil < Date.now()){
            console.log("user allowed to sell on market");
            console.log("excess power for user " + index);
            //Send to battery

            //Gör om i DB:n så det är shareToBattery så blir det lättare/snyggare i koden
            var excessPowerBattery = prosumerList[index].power * (1-prosumerList[index].shareToMarket * 0.01)
            var excessPowerMarket = prosumerList[index].power * prosumerList[index].shareToMarket * 0.01;
            var battery = prosumerList[index].battery;
            var batteryCapacity = prosumerList[index].batteryCapacity;

            if (battery >= batteryCapacity){
                prosumerList[index].battery = batteryCapacity;
                console.log("Battery of user " + index + " already full");
            }

            else if (excessPowerBattery + battery >= batteryCapacity){
                prosumerList[index].battery = batteryCapacity;

                excessPowerBattery = excessPowerBattery + battery - batteryCapacity;
                
                console.log("Battery of user " + index + " set to " + batteryCapacity);
            }

            else{
                prosumerList[index].battery = excessPowerBattery + battery;
                excessPowerBattery = 0;
                console.log("Battery of user " + index + " set to " + (prosumerList[index].battery));
            }

            //Send to market
            excessPowerMarket = excessPowerMarket + excessPowerBattery;
            market += excessPowerMarket;
            console.log("User " + index + " sent " + excessPowerMarket + " power to market");

            prosumerList[index].power = 0;
        }

        else{
            console.log("User blocked from selling on market!");
            prosumerList[index].battery += prosumerList[index].power;
            prosumerList[index].power = 0;
            if (prosumerList[index].battery > prosumerList[index].batteryCapacity){
                prosumerList[index].battery = prosumerList[index].batteryCapacity;
            }
        }
    }

    if (prosumerList[index].manager == 1 && prosumerList[index].powerplantStatus != "running"){
        if (prosumerList[index].power < 0 && prosumerList[index].battery > 0){
            if (prosumerList[index].battery > (prosumerList[index].power*-1)){
                prosumerList[index].battery = prosumerList[index].battery - (prosumerList[index].power*-1);
                prosumerList[index].power = 0;
            }
            else{
                prosumerList[index].power += prosumerList[index].battery;
                prosumerList[index].battery = 0;
            }
            console.log("Manager used its battery to power itself");
        }


        market += prosumerList[index].battery;
        prosumerList[index].battery = 0;
    }
}

function handleMissingPower(index, prosumerList, manager){
    if (prosumerList[index].power < 0){
        console.log("Missing power for user " + index);

        let percentageFromMarket = prosumerList[index].marketSharePurchase * 0.01;
        let percentageFromBattery = (1 - prosumerList[index].marketSharePurchase * 0.01);

        let missingPowerBattery = (prosumerList[index].power * -1) * percentageFromBattery;
        let missingPowerMarket = (prosumerList[index].power * -1) * percentageFromMarket;

        var notEnoughFromBattery = getPowerFromBattery(missingPowerBattery, index, prosumerList);
        var notEnoughFromMarket = getPowerFromMarket(missingPowerMarket, index, prosumerList);;

        let missingPower = prosumerList[index].power * -1;

        //Battery empty, market not empty
        if (notEnoughFromBattery && !notEnoughFromMarket){
            getPowerFromMarket(missingPower, index, prosumerList);
        }

        //Battery not empty, market empty
        else if (!notEnoughFromBattery && notEnoughFromMarket){
            getPowerFromBattery(missingPower, index, prosumerList);
        }
    }

    else{
        console.log("No missing power for user " + index);
    }
}

function getPowerFromBattery(missingPowerBattery, index, prosumerList){
    let battery = prosumerList[index].battery;
    if (battery != 0){
        if (battery >= missingPowerBattery){
            let newBattery = battery-missingPowerBattery;
            let newPower = prosumerList[index].power + missingPowerBattery;
            prosumerList[index].battery = newBattery;
            prosumerList[index].power = newPower;
            console.log("User " + index + " took " + missingPowerBattery + " power from battery");
            return false;
        }

        else{
            let newPower = prosumerList[index].power + battery;
            prosumerList[index].battery = 0;
            prosumerList[index].power = newPower;
            console.log("User " + index + " took " + battery + " power from battery (not enough to fulfill user demand)");
            return true;
        }
    }

    else{
        console.log("User " + index + " tried to get power from battery but it was empty");
        return true;
    }
}

function getPowerFromMarket(missingPowerMarket, index, prosumerList){
    if (market != 0){ //If market not empty
        let availablePower = market;

        if (availablePower >= missingPowerMarket){
            let newMarket = availablePower-missingPowerMarket;
            let newPower = prosumerList[index].power + missingPowerMarket;
            market = newMarket;
            prosumerList[index].power = newPower;
            console.log("User " + index + " bought " + missingPowerMarket + " power from market");
            return false;
        }

        else{
            let newPower = prosumerList[index].power + availablePower;
            market = 0;
            prosumerList[index].power = newPower;
            console.log("User " + index + " took " + availablePower + " power from market (not enough to fulfill user demand)");
            return true;
        }
    }

    else{
        console.log("User " + index + " tried to buy power but market was empty");
        return true;
    }
}

function checkBlackout(index, prosumerList){
    let power = prosumerList[index].power;
    let blackout = prosumerList[index].blackout;
    if (power < 0){
        prosumerList[index].blackout = 1;
        console.log("User " + index + " has experienced a blackout, currentpower: " + power);
    }
    else if (blackout == 1){
        prosumerList[index].blackout = 0;
        console.log("Blackout status removed from user " + index);
    }
    else{
        console.log("no blackout for user " + index);
    }
}
