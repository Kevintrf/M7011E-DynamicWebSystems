var createDist = require('distributions-normal');
var db = require('./database'); 

class Prosumer {
    constructor(id, battery, batteryCapacity, power, production, consumption, shareToMarket, marketSharePurchase, blackout) {
        this.id = id;
        this.battery = battery;
        this.batteryCapacity = batteryCapacity;
        this.power = power;
        this.production = production;
        this.consumption = consumption;
        this.shareToMarket = shareToMarket;
        this.marketSharePurchase = marketSharePurchase;
        this.blackout = blackout;
    }

    setPower(power){
        this.power = power;
    }

    setBlackout(blackout){
        this.blackout = blackout;
    }
}

class MarketEntry {
    constructor(id, power){
        this.id = id;
        this.power = power;
    }

    setPower(power){
        this.power = power;
    }
}

prosumer1 = new Prosumer(1, 0, 50, 0, 0, 0, 25, 50, 0);
prosumer2 = new Prosumer(2, 0, 50, 0, 0, 0, 50, 50, 0);
prosumer3 = new Prosumer(3, 0, 50, 0, 0, 0, 75, 50, 0);

let prosumersList = [prosumer1, prosumer2, prosumer3];

let market = [];

generatePowerLoop(0, 1);

function generatePowerLoop(index, loopSize){
    console.log("generatePowerLoop begin for user " + index);
    let generatePowerPromise = new Promise(function(resolve, reject) {
        resolve(generatePower(index));
    });

    generatePowerPromise.then(function(value) {
        console.log("generatePower promise resolved for user " + index);
        if (index < loopSize){
            generatePowerLoop(index+1, loopSize);
        }

        else{
            handleExcessPowerLoop(0, loopSize);
        }
    });
}

function handleExcessPowerLoop(index, loopSize){
    console.log("handleExcessPowerLoop begin for user " + index);
    let handleExcessPowerPromise = new Promise(function(resolve, reject) {
        resolve(handleExcessPower(index));
    });

    handleExcessPowerPromise.then(function(value) {
        console.log("handleExcessPower promise resolved for user " + index);
        if (index < loopSize){
            handleExcessPowerLoop(index+1, loopSize);
        }

        else{
            handleMissingPowerLoop(0, loopSize);
        }
    });
}

function handleMissingPowerLoop(index, loopSize){
    console.log("handleMissingPowerLoop begin for user " + index);
    let handleMissingPowerPromise = new Promise(function(resolve, reject) {
        resolve(handleMissingPower(index));
    });

    handleMissingPowerPromise.then(function(value) {
        console.log("handleMissingPower promise resolved for user " + index);
        if (index < loopSize){
            handleMissingPowerLoop(index+1, loopSize);
        }

        else{
            blackoutLoop(0, loopSize);
        }
    });
}

function blackoutLoop(index, loopSize){
    console.log("blackoutLoop begin for user " + index);

    let blackoutPromise = new Promise(function(resolve, reject) {
        resolve(checkBlackout(index));
    });

    blackoutPromise.then(function(value) {
        console.log("blackoutPower promise resolved for user " + index);
        if (index < loopSize){
            blackoutLoop(index+1, loopSize);
        }

        else{
            updateDatabase();
        }
    });
}

function updateDatabase(){
    console.log("updating database (does nothing currently, placeholder)");
}


//Runs function updateServer every second until stopFunction() is called
/*setInterval(function(){ 
    updateServer() 
}, 1000);
*/

async function getProsumerCountFromDatabase(){
    db.sendToDatabase("SELECT count(*) as value FROM prosumers;", function(data){
        return data[0].value;
    });
}

async function currrentConsumption(){
    //Returns hourly usage of 
    var normal = await createDist();

    await normal.mean(11);
    await normal.variance(3);

    //Divided by 24 to get hourly usage
    var output = (normal.inv([Math.random()]) / 24);
    return output;
}

async function currentWindSpeed(){
    //Collect actual weather data instead of this
    var dailyMeanValue = 4; //Measured in knots

    var normal = await createDist();

    await normal.mean(dailyMeanValue);
    await normal.variance(5);

    //Ändra i random så att det är mer sannolikt att få ett väldigt lågt värde? Vanligt att det blir vindstilla men inte att det typ blir storm
    var output = parseFloat(normal.inv([Math.random()]));

    //Wind cant be negative
    if (output < 0)
        output = 0;

    console.log("windspeed: " + output);
    return output;
}

//Behöver förbättras
async function currentMarketPrice(){
    //getTotalConsumption does not exist yet
    let marketPrice = getTotalConsumption()/currentWindSpeed();
    return marketPrice;
}

async function sendToMarket(index, amount){
    let prosumerPower = prosumersList[index].power;
    prosumersList[index].power = prosumerPower-amount;
    newMarketEntry = new MarketEntry(index, amount);
    market.concat(market, newMarketEntry);
    console.log("User " + index + " sent " + amount + " power to market");
}

//Funkar som den ska, kan fucka om flera kör nära inpå utan async/promises eller liknande
async function getFromMarket(index, amount){
    //Avoids negative values
    if (amount < 0)
        amount = await amount * -1;

    if (market.length > 0){
        let availablePower = market[i].power;

        if (availablePower >= amount){
            let excess = availablePower-amount;
            market[i].setPower(excess)
            let newPower = prosumersList[index].power + amount;
            prosumersList[index].setPower(newPower);
            console.log("User " + index + " bought " + amount + " power from market");
        }

        else{
            let newPower = availablePower + prosumersList[index].power;
            prosumersList[index].setPower(newPower);
            market.pop[i]; //Tar detta bort ordentligt? undersök senare
            console.log("User " + index + " bought " + availablePower + " power from market (not enough to fulfill user demand)");
            getFromMarket(index, amount-availablePower);
        }
    }

    else{
        //Finns ingen energi på market, returna något fint om det?
        console.log("User " + index + " tried to buy power but market was empty");
    }
}

//Funkar som den ska, kan fucka om flera kör nära inpå utan async/promises eller liknande
async function getFromBattery(index, amount){
    //Avoids negative values
    if (amount < 0)
        amount = amount * -1;
    
        let availablePower = prosumersList[index].battery;
        if (availablePower >= amount){
            let newBattery = availablePower-amount;
            let newPower = prosumersList[index].power + amount;
            prosumersList[index].setBattery(newBattery);
            prosumersList[index].setPower(newPower);
            console.log("User " + index + " took " + amount + " power from battery");
        }

        else{
            let newPower = prosumersList[index].power + availablePower;
            prosumersList[index].battery = 0;
            prosumersList[index].power = newPower;
                console.log("User " + index + " took " + availablePower + " power from battery (not enough to fulfill user demand)");
                //Return that we didnt get enough power from the battery
        }
}

//Funkar som den ska
async function sendToBattery(index, amount){
        let currentBattery = prosumersList[index].battery;
        let batteryCapacity =  prosumersList[index].batteryCapacity;
        
        //Automatically sell excess power?
        if (amount+currentBattery > batteryCapacity){
        prosumersList[index].battery = batteryCapacity;
                console.log("Battery of user " + index + " set to " + batteryCapacity);
        }
        else{
            prosumersList[index].battery = amount+currentBattery;
                console.log("Battery of user " + index + " set to " + (amount+currentBattery));
    }
}

//Funkar
async function generatePower(index){
    //const windSpeed = await parseFloat(await currentWindSpeed());
    //onst consumption = await parseFloat(await currrentConsumption());
    //const power = await parseFloat((await windSpeed * 0.2) - await consumption);
    let production = await parseFloat(await currentWindSpeed() * 0.2);
    console.log("prod " + production);
    let consumption = await currrentConsumption();
    console.log("cons " + consumption);
    let power = await production - consumption;
    console.log("power "+ power);
    //let power = await parseFloat((await currentWindSpeed() * 0.2) - await currrentConsumption());

    prosumersList[index].production = production;
    prosumersList[index].consumption = consumption;
    prosumersList[index].power = power;
    console.log("User " + index + " production has been set to " + production);
    console.log("User " + index + " consumption has been set to " + consumption);
    console.log("User " + index + " power has been set to " + power);

    return Promise.resolve("resolved");
}

async function handleExcessPower(index){
        let power = prosumersList[index].power;
        if (power > 0){
            console.log("excess power for user " + index);
            let percentageToMarket = prosumersList[index].shareToMarket*0.01;


            //Gör om, gör så både sentToMarket och sendToBattery finns här i. Skicka till battery först och ALLT överskott ska till market
            await sendToMarket(index, power*percentageToMarket);
            await sendToBattery(index, power*(1-percentageToMarket));
        }
        //kommer behöva promises i både market o battery
        return Promise.resolve("resolved");
}

async function handleMissingPower(index){
        let power = prosumersList[index].power;
        if (power < 0){
            let percentageFromMarket = prosumersList[index].marketSharePurchase*0.01;

            getFromMarket(index, power*percentageFromMarket);

            getFromBattery(index, power*(1-percentageFromMarket));

            return Promise.resolve("resolved");
                
            //Some asyncronous waiting fix, this code should only be run after the market and battery queries are completed
            //Tries to get all the power from market/battery, to avoid blackout, only happens if market/battery did not have enough
            //Maybe should only be run if some setting in user interface allows it?
            /*
            db.sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                let power = prosumerData[0].power;
                getFromBattery(id, power);
                //async and wait
                db.sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                    let power = prosumerData[0].power;
                    getFromMarket(id, power);
                });
            });*/
        }

        else{
            return Promise.resolve("resolved");
        }
}

async function checkBlackout(index){
    let power = await prosumersList[index].power;
    let blackout = await prosumersList[index].blackout;
    if (power < 0){
        prosumersList[index].setBlackout(1);
        console.log("User " + index + " has experienced a blackout, currenpower: " + power);
    }
    else if (blackout == 1){
        prosumersList[index].setBlackout(0);
        console.log("Blackout status removed from user " + index);
    }
    else{
        console.log("no blackout for " + index);
    }
    return Promise.resolve("resolved");
}
