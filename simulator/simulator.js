var createDist = require('distributions-normal');
var db = require('./database'); 

var market = 0;

//Runs the program every second
setInterval(async function(){
    await updateProsumersFromDatabase();
}, 1000);

async function updateProsumersFromDatabase(){
    try {
        await db.sendToDatabase("SELECT * FROM prosumers;", async function(data){
            var prosumerList = data;
            var manager;

            prosumerList.forEach(function(item, index) {
                if (prosumerList[index].manager == true){
                    manager = index;
                }
            });

            if (manager == undefined){
                //NÅGOT HAR GÅTT HELT FEL, HJÄLP
            }

            prosumerList.forEach(function(item, index) {
                generatePower(index, prosumerList);
            });

            prosumerList.forEach(function(item, index) {
                handleExcessPower(index, prosumerList, manager);
            });

            prosumerList.forEach(function(item, index) {
                handleMissingPower(index, prosumerList, manager);
            });

            prosumerList.forEach(function(item, index) {
                checkBlackout(index, prosumerList);
            });

            prosumerList.forEach(function(item, index) {
                updateDatabaseProsumerEntry(index, prosumerList);
            });
        });
    }

    catch (e){
        console.log("Error in updateloop: " + e);
    }
}

//https://stackoverflow.com/questions/4205181/insert-into-a-mysql-table-or-update-if-exists for INSERT INTO or UPDATE IF EXIST
function updateDatabaseProsumerEntry(index, prosumerList){
    console.log("updating database for user " + index);

    //Kommer krasha om prosumern inte redan finns
    try{
        db.sendToDatabase("UPDATE prosumers SET battery =" + prosumerList[index].battery + 
        ", power=" + prosumerList[index].power + 
        ", production=" + prosumerList[index].production + 
        ", consumption =" + prosumerList[index].consumption + 
        ", blackout=" + prosumerList[index].blackout + 
        " WHERE id=" + prosumerList[index].id, function(data){
            console.log("Database entry updated for user " + index);
        });
    }

    catch (e){
        console.log("Error updating database: " + e);
    }
}

function currrentConsumption(){
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
    //const windSpeed = await parseFloat(await currentWindSpeed());
    //onst consumption = await parseFloat(await currrentConsumption());
    //const power = await parseFloat((await windSpeed * 0.2) - await consumption);
    let production = parseFloat(currentWindSpeed() * 0.2);
    console.log("prod " + production);
    let consumption = currrentConsumption();
    console.log("cons " + consumption);
    let power = production - consumption;
    console.log("power "+ power);
    //let power = await parseFloat((await currentWindSpeed() * 0.2) - await currrentConsumption());

    prosumerList[index].production = production;
    prosumerList[index].consumption = consumption;
    prosumerList[index].power = power;
    console.log("User " + index + " production has been set to " + production);
    console.log("User " + index + " consumption has been set to " + consumption);
    console.log("User " + index + " power has been set to " + power);
}

function handleExcessPower(index, prosumerList, manager){
    if (prosumerList[index].power > 0){
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
        console.log("User " + index + " sent " + excessPowerMarket + " power to market (DOES NOTHING NOW, FIX LATER)");

        prosumerList[index].power = 0;
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
