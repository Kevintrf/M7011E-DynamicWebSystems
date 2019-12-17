var createDist = require('distributions-normal');
var db = require('./database'); 

class Prosumer {
    constructor(id, battery, batteryCapacity, power, shareToMarket, marketSharePurchase, blackout) {
        this.id = id;
        this.battery = battery;
        this.batteryCapacity = batteryCapacity;
        this.power = power;
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

class Market {
    constructor(id, power){
        this.id = id;
        this.power = power;
    }
}

prosumer1 = new Prosumer(1, 0, 50, 0, 25, 50, 0);
prosumer2 = new Prosumer(2, 0, 50, 0, 50, 50, 0);
prosumer3 = new Prosumer(3, 0, 50, 0, 75, 50, 0);

let prosumersList = [prosumer1, prosumer2, prosumer3];
console.log(prosumersList[0].batteryCapacity);

//console.log(prosumersList[0].power);
//prosumersList[0].changePower(10);
//console.log(prosumersList[0].power);



//Runs function updateServer every second until stopFunction() is called
/*setInterval(function(){ 
    updateServer() 
}, 1000);*/

async function updateServer() {
    await db.sendToDatabase("SELECT count(*) as value FROM prosumers;", async function(data){
        powerCycle(data[0].value);
    });
}

//Make these synchronous, every loop should also be synchronous, each loop should be done before the next loop starts
async function powerCycle(userAmount){
    //resetPowerAllProsumers();

    /*for (let i=1; i < userAmount+1; i++){
        await generatePower(i);
    }
    
    for (let i=1; i<userAmount+1; i++){
        await handleExcessPower(i);
    }

    for (let i=1; i<userAmount+1; i++){
        await handleMissingPower(i);
    }

    for (let i=1; i<userAmount+1; i++){
        await checkBlackout(i);
    }*/
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
    var dailyMeanValue = 10; //Measured in knots

    var normal = await createDist();

    await normal.mean(dailyMeanValue);
    await normal.variance(5);

    //Ändra i random så att det är mer sannolikt att få ett väldigt lågt värde? Vanligt att det blir vindstilla men inte att det typ blir storm
    var output = parseFloat(normal.inv([Math.random()]));
    return output;
}

//Behöver förbättras
async function currentMarketPrice(){
    //getTotalConsumption does not exist yet
    let marketPrice = getTotalConsumption()/currentWindSpeed();
    return marketPrice;
}

async function sendToMarket(id, amount){
    //Add to check if id already exists, the same id should never be able to send something twice (since the table is emptied every cycle), what to do if it does?
    await db.sendToDatabase("DELETE FROM market WHERE id=" + id + ";", async function(){
        await db.sendToDatabase("INSERT INTO market VALUES(" + id + ", " + amount + ");", async function(){
            console.log("User " + id + " sent " + amount + " power to market");
            return new Promise(function(resolve, reject){
                resolve('resolved');
            });
        });
    });
}

//Funkar som den ska, kan fucka om flera kör nära inpå utan async/promises eller liknande
async function getFromMarket(id, amount){
    //Avoids negative values
    if (amount < 0)
        amount = await amount * -1;

    await db.sendToDatabase("SELECT * FROM market WHERE power!=0;", async function(marketData){
        if (marketData[0] != undefined){
            let availablePower = marketData[0].power;
            if (availablePower >= amount){
                let excess = availablePower-amount;
                await db.sendToDatabase("UPDATE market SET power =" + excess + " WHERE id=" + marketData[0].id + ";", async function(){
                    await db.sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", async function(prosumerData){
                        let newPower = prosumerData[0].power + amount;
                        await db.sendToDatabase("UPDATE prosumers SET power=" + newPower + " WHERE ID=" + id +";", async function(){
                            console.log("User " + id + " bought " + amount + " power from market");
                        });
                    });
                });
            }

            else{
                await db.sendToDatabase("DELETE FROM market WHERE id=" + marketData[0].id + ";", async function(){
                    await db.sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", async function(prosumerData){
                        let newPower = prosumerData[0].power + availablePower;
                        await db.sendToDatabase("UPDATE prosumers SET power=" + newPower + " WHERE ID=" + id +";", async function(){
                            console.log("User " + id + " bought " + availablePower + " power from market (not enough to fulfill user demand)");
                            await getFromMarket(id, amount-availablePower);
                        });
                    });
                });
            }
        }

        else{
            //Finns ingen energi på market, returna något fint om det?
            console.log("User " + id + " tried to buy power but market was empty");
        }
    });
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
            prosumersList[index].setBattery(0);
            prosumersList[index].setPower(newPower);
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
        prosumersList[index].setBattery(batteryCapacity);
                console.log("Battery of user " + id + " set to " + batteryCapacity);
        }
        else{
            prosumersList[index].setBattery(amount+currentBattery);
                console.log("Battery of user " + id + " set to " + (amount+currentBattery));
}

//Funkar
async function generatePower(index){
    //const windSpeed = await parseFloat(await currentWindSpeed());
    //onst consumption = await parseFloat(await currrentConsumption());
    //const power = await parseFloat((await windSpeed * 0.2) - await consumption);

    let power = await parseFloat((await currentWindSpeed() * 0.2) - await currrentConsumption());
    if (id == 2){
        power = -1.35;
    }

    prosumersList[index].setPower(power);
}

async function handleExcessPower(index){
        let power = prosumersList[index].power;

        if (power > 0){
            let percentageToMarket = prosumersList[index].shareToMarket*0.01;
            await sendToMarket(index, power*percentageToMarket);
            await sendToBattery(index, power*(1-percentageToMarket));
        }
}

async function handleMissingPower(index){
        let power = prosumersList[index].power;
        if (power < 0){
            let percentageFromMarket = prosumersList[index].marketSharePurchase*0.01;

                getFromMarket(index, power*percentageFromMarket);

                getFromBattery(index, power*(1-percentageFromMarket));
                
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
}
}

generatePower(0);
