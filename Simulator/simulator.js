var createDist = require('distributions-normal');
var db = require('./database'); 



//Runs function updateServer every second until stopFunction() is called
setInterval(function(){ 
    updateServer() 
}, 2000);

async function updateServer() {
    await db.sendToDatabase("SELECT count(*) as value FROM prosumers;", async function(data){
        await generatePower(1, data[0].value);
        //powerCycle(data[0].value);
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

//funkar som den ska
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
                            return new Promise(function(resolve, reject){
                                resolve('resolved');
                            });
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
            return new Promise(function(resolve, reject){
                resolve('resolved');
            });
        }
    });
}

//Funkar som den ska, kan fucka om flera kör nära inpå utan async/promises eller liknande
async function getFromBattery(id, amount){
    //Avoids negative values
    if (amount < 0)
        amount = amount * -1;
    
    await db.sendToDatabase("SELECT battery, power FROM prosumers WHERE id="+ id + ";", async function(data){
        let availablePower = data[0].battery;
        if (availablePower >= amount){
            let newBattery = availablePower-amount;
            let newPower = data[0].power + amount;
            await db.sendToDatabase("UPDATE prosumers SET battery=" + newBattery + ", power=" + newPower + " WHERE id=" + id + ";", async function(){
                console.log("User " + id + " took " + amount + " power from battery");
                return new Promise(function(resolve, reject){
                    resolve('resolved');
                });
            });
        }

        else{
            let newPower = data[0].power + availablePower;
            await db.sendToDatabase("UPDATE prosumers SET battery=0, power=" + newPower + " WHERE id=" + id + ";", async function (){
                console.log("User " + id + " took " + availablePower + " power from battery (not enough to fulfill user demand)");
                //Return that we didnt get enough power from the battery
                return new Promise(function(resolve, reject){
                    resolve('resolved');
                });
            });
        }
    });
}

//Funkar som den ska
async function sendToBattery(id, amount){
    await db.sendToDatabase("SELECT battery, batteryCapacity FROM prosumers WHERE id=" + id + ";", async function(data){
        let currentBattery = data[0].battery;
        let batteryCapacity =  data[0].batteryCapacity;
        
        //Automatically sell excess power?
        if (amount+currentBattery > batteryCapacity)
            await db.sendToDatabase("UPDATE prosumers SET battery =" + batteryCapacity +  " WHERE id=" + id + ";", async function(){
                console.log("Battery of user " + id + " set to " + batteryCapacity);
                return new Promise(function(resolve, reject){
                    resolve('resolved');
                });
            });
        else
            await db.sendToDatabase("UPDATE prosumers SET battery =" + (amount+currentBattery) + " WHERE id=" + id + ";", async function(){
                console.log("Battery of user " + id + " set to " + (amount+currentBattery));
                return new Promise(function(resolve, reject){
                    resolve('resolved');
                });
            });
    
    });
}

//funkar
async function resetPowerAllProsumers(){
    await db.sendToDatabase("UPDATE prosumers SET power=0, blackout=0;", async function(){
        console.log("Power and blackout states of all prosumers have been reset")
    });
}

//Funkar
async function generatePower(id, userAmount){
    //const windSpeed = await parseFloat(await currentWindSpeed());
    //onst consumption = await parseFloat(await currrentConsumption());
    //const power = await parseFloat((await windSpeed * 0.2) - await consumption);

    let power = await parseFloat((await currentWindSpeed() * 0.2) - await currrentConsumption());
    if (id == 2){
        power = -1.35;
    }
    await db.sendToDatabase("UPDATE prosumers SET power =" + power + " WHERE id=" + id + ";", async function(data) {
        console.log("Updated power of user " + id + " to " + power);
        if (id < userAmount){
            await generatePower(id+1, userAmount);
        }
        else {
            await handleExcessPower(1, userAmount);
        }
    });
}

async function handleExcessPower(id, userAmount){
    await db.sendToDatabase("SELECT power, shareToMarket FROM prosumers WHERE id=" + id + ";", async function(prosumerData){
        let power = prosumerData[0].power;

        if (power > 0){
            let percentageToMarket = prosumerData[0].shareToMarket*0.01;
            await sendToMarket(id, power*percentageToMarket);
            await sendToBattery(id, power*(1-percentageToMarket));

            let promise1 = new Promise(function(resolve, reject) {
                resolve(sendToMarket(id, power*percentageToMarket));
            });

            let promise2 = new Promise(function(resolve, reject) {
                resolve(sendToBattery(id, power*(1-percentageToMarket)));
            });

            Promise.all([promise1, promise2]).then(async function(values) {
                if (id < userAmount){
                    await handleExcessPower(id+1, userAmount);
                }
                else {
                    await handleMissingPower(1, userAmount);
                }
            });
        }

        else{
            if (id < userAmount){
                await handleExcessPower(id+1, userAmount);
            }
            else {
                await handleMissingPower(1, userAmount);
            }
        }
    });
}

async function handleMissingPower(id, userAmount){
    await db.sendToDatabase("SELECT power, marketSharePurchase FROM prosumers WHERE id=" + id + ";", async function(prosumerData){
        let power = prosumerData[0].power;
        console.log("handlemissingpower user " + id);
        if (power < 0){
            let percentageFromMarket = prosumerData[0].marketSharePurchase*0.01;

            let promise1 = new Promise(function(resolve, reject) {
                resolve(getFromMarket(id, power*percentageFromMarket));
            });

            promise1.then(function(value) {
                let promise2 = new Promise(function(resolve, reject) {
                    resolve(getFromBattery(id, power*(1-percentageFromMarket)));
                });

                promise2.then(async function(value) {
                    console.log("promise2");
                    if (id < userAmount){
                        await handleMissingPower(id+1, userAmount);
                    }
                    else {
                        await checkBlackout(1, userAmount);
                    }
                });
            });
            
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
            if (id < userAmount){
                await handleMissingPower(id+1, userAmount);
            }
            else {
                await checkBlackout(1, userAmount);
            }
        }
    });
}

async function checkBlackout(id, userAmount){
    //Problem, select power queryn som utförs raden under hämtar power från innan buyFromMarket men efter getFromBattery
    await db.sendToDatabase("SELECT power, blackout FROM prosumers where id=" + id +";", async function(prosumerData){
        let power = prosumerData[0].power;
        let blackout = prosumerData[0].blackout;
        if (power < 0){
            await db.sendToDatabase("UPDATE prosumers SET blackout=1 WHERE id=" + id + ";", async function(){
                console.log("User " + id + " has experienced a blackout, currenpower: " + power);
            });
        }
        else if (blackout == 1){
            await db.sendToDatabase("UPDATE prosumers SET blackout=0 WHERE id=" + id + ";", async function(){
                console.log("Blackout status removed from user " + id);
            });
        }
        if (id < userAmount){
            await checkBlackout(id+1, userAmount);
        }
    });
}

