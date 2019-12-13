var mysql = require('mysql');
var createDist = require('distributions-normal');
var db = require('./database'); 



//Runs function updateServer every second until stopFunction() is called
setInterval(function(){ 
    updateServer() 
}, 1000);

async function updateServer() {

    await generatePower(1);
    console.log(1);
    await generatePower(2);
    console.log(2);
    await generatePower(3);
    console.log(3);

    /*db.sendToDatabase("SELECT count(*) as value FROM prosumers;", function(data){
        powerCycle(data[0].value);
    });*/
}

//Make these synchronous, every loop should also be synchronous, each loop should be done before the next loop starts
async function powerCycle(userAmount){
    //resetPowerAllProsumers();

    for (let i=1; i < userAmount+1; i++){
        await generatePower(i).then(console.log("loop for " + i));
        //console.log("loop for " + i);
    }

    /*
    for (let i=1; i<userAmount+1; i++){
        handleExcessPower(i);
    }

    for (let i=1; i<userAmount+1; i++){
        handleMissingPower(i);
    }

    for (let i=1; i<userAmount+1; i++){
        checkBlackout(i);
    }
    */
}

async function currrentConsumption(){
    //Returns hourly usage of 
    var normal = await createDist();

    await normal.mean(11);
    await normal.variance(3);

    //Divided by 24 to get hourly usage
    var output = await (normal.inv([Math.random()])/24);
    return output;
}

async function currentWindSpeed(){
    //Collect actual weather data instead of this
    var dailyMeanValue = 10; //Measured in knots

    var normal = await createDist();

    await normal.mean(dailyMeanValue);
    await normal.variance(5);

    //Ändra i random så att det är mer sannolikt att få ett väldigt lågt värde? Vanligt att det blir vindstilla men inte att det typ blir storm
    var output = await parseFloat(normal.inv([Math.random()]));
    return output;
}

//Behöver förbättras
function currentMarketPrice(){
    //getTotalConsumption does not exist yet
    let marketPrice = getTotalConsumption()/currentWindSpeed();
    return marketPrice;
}

//funkar som den ska
function sendToMarket(id, amount){
    //Add to check if id already exists, the same id should never be able to send something twice (since the table is emptied every cycle), what to do if it does?
    db.sendToDatabase("DELETE FROM market WHERE id=" + id + ";", function(){
        db.sendToDatabase("INSERT INTO market VALUES(" + id + ", " + amount + ");", function(){
            console.log("User " + id + " sent " + amount + " power to market");
        });
    });
}

//Funkar som den ska, kan fucka om flera kör nära inpå utan async/promises eller liknande
function getFromMarket(id, amount){
    //Avoids negative values
    if (amount < 0)
        amount = amount * -1;

    db.sendToDatabase("SELECT * FROM market WHERE power!=0;", function(marketData){
        if (marketData[0] != undefined){
            let availablePower = marketData[0].power;
            if (availablePower >= amount){
                let excess = availablePower-amount;
                db.sendToDatabase("UPDATE market SET power =" + excess + " WHERE id=" + marketData[0].id + ";", function(){
                    db.sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                        let newPower = prosumerData[0].power + amount;
                        db.sendToDatabase("UPDATE prosumers SET power=" + newPower + " WHERE ID=" + id +";", function(){
                            console.log("User " + id + " bought " + amount + " power from market");
                        });
                    });
                });
            }

            else{
                db.sendToDatabase("DELETE FROM market WHERE id=" + marketData[0].id + ";", function(){
                    db.sendToDatabase("SELECT power FROM prosumers WHERE id=" + id + ";", function(prosumerData){
                        let newPower = prosumerData[0].power + availablePower;
                        db.sendToDatabase("UPDATE prosumers SET power=" + newPower + " WHERE ID=" + id +";", function(){
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
    
    db.sendToDatabase("SELECT battery, power FROM prosumers WHERE id="+ id + ";", function(data){
        let availablePower = data[0].battery;
        if (availablePower >= amount){
            let newBattery = availablePower-amount;
            let newPower = data[0].power + amount;
            db.sendToDatabase("UPDATE prosumers SET battery=" + newBattery + ", power=" + newPower + " WHERE id=" + id + ";", function(){
                console.log("User " + id + " took " + amount + " power from battery");
            });
        }

        else{
            let newPower = data[0].power + availablePower;
            db.sendToDatabase("UPDATE prosumers SET battery=0, power=" + newPower + " WHERE id=" + id + ";", function (){
                console.log("User " + id + " took " + availablePower + " power from battery (not enough to fulfill user demand)");
                //Return that we didnt get enough power from the battery
            });
        }
    });
}

//Funkar som den ska
function sendToBattery(id, amount){
    db.sendToDatabase("SELECT battery, batteryCapacity FROM prosumers WHERE id=" + id + ";", function(data){
        let currentBattery = data[0].battery;
        let batteryCapacity =  data[0].batteryCapacity;
        
        //Automatically sell excess power?
        if (amount+currentBattery > batteryCapacity)
            db.sendToDatabase("UPDATE prosumers SET battery =" + batteryCapacity +  " WHERE id=" + id + ";", function(){
                console.log("Battery of user " + id + " set to " + batteryCapacity);
            });
        else
            db.sendToDatabase("UPDATE prosumers SET battery =" + (amount+currentBattery) + " WHERE id=" + id + ";", function(){
                console.log("Battery of user " + id + " set to " + (amount+currentBattery));
            });
    
    });
}

//funkar
function resetPowerAllProsumers(){
    db.sendToDatabase("UPDATE prosumers SET power=0, blackout=0;", function(){
        console.log("Power and blackout states of all prosumers have been reset")
    });
}

//Funkar
async function generatePower(id){
    
    //const windSpeed = await parseFloat(await currentWindSpeed());
    //onst consumption = await parseFloat(await currrentConsumption());
    //const power = await parseFloat((await windSpeed * 0.2) - await consumption);

    const power = await parseFloat((await currentWindSpeed() * 0.2) - await currrentConsumption());
    console.log("start " + id);
    await db.sendToDatabase("UPDATE prosumers SET power =" + power + " WHERE id=" + id + ";", function(data){
        console.log("Updated power of user " + id + " to " + power);
        return;
    });
    console.log("start " + id);
}

function handleExcessPower(id){
    db.sendToDatabase("SELECT power, shareToMarket FROM prosumers WHERE id=" + id + ";", function(prosumerData){
        let power = prosumerData[0].power;

        if (power > 0){
            let percentageToMarket = prosumerData[0].shareToMarket*0.01;
            sendToMarket(id, power*percentageToMarket);
            sendToBattery(id, power*(1-percentageToMarket));
        }
    });
}

function handleMissingPower(id){
    db.sendToDatabase("SELECT power, marketSharePurchase FROM prosumers WHERE id=" + id + ";", function(prosumerData){
        let power = prosumerData[0].power;

        if (power < 0){
            let percentageFromMarket = prosumerData[0].marketSharePurchase*0.01;
            getFromMarket(id, power*percentageFromMarket);
            getFromBattery(id, power*(1-percentageFromMarket));
            
            
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
    });
}

//funkar som den ska
//Blackout value (bit) in sql needs to be accessed as "SELECT blackout+0 FROM prosumers;", 
//the +0 converts it to an integer otherwise it prints a literal bit (which will break stuff)
function checkBlackout(id){
    db.sendToDatabase("SELECT power FROM prosumers where id=" + id +";", function(prosumerData){
        let power = prosumerData[0].power;
        if (power < 0){
            db.sendToDatabase("UPDATE prosumers SET blackout=1 WHERE id=" + id + ";", function(){
                console.log("User " + id + " has experienced a blackout");
            });
        }
    });
}

//---OBSELETE, ersatt av handleExcessPower och handleMissingPower------
//funkar,
function powerManagement(id){
    db.sendToDatabase("SELECT power, shareToMarket, marketSharePurchase FROM prosumers WHERE id=" + id + ";", function(prosumerData){
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
    });
}
