var mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/kotol');
mongoose.connect('mongodb://heroku:heroku-bojler@boilertimeconfigs-shard-00-00-ssig8.mongodb.net:27017,boilertimeconfigs-shard-00-01-ssig8.mongodb.net:27017,boilertimeconfigs-shard-00-02-ssig8.mongodb.net:27017/kotol?ssl=true&replicaSet=boilerTimeConfigs-shard-0&authSource=admin');

var TimeConfig = require('./models/timeConfig');
var CurrentTimeConfig = require('./models/currentTimeConfig');


// wiringpi start
var wiringpi = require('wiringpi-node');

function wiringpiFunctionality() {
    // # use 'GPIO naming'
    wiringpi.setup('gpio');

    // # set #18 to be a PWM output
    wiringpi.pinMode(18, wiringpi.PWM_OUTPUT);

    // # set the PWM mode to milliseconds stype
    wiringpi.pwmSetMode(wiringpi.PWM_MODE_MS);

    // # divide down clock
    wiringpi.pwmSetClock(192);
    wiringpi.pwmSetRange(2000);
}

function wiringpiClear() {
    wiringpi.pinMode(18, wiringpi.INPUT);
}

var min = 80;
var max = 260;
var currentAngle = min;
var delayPeriod = 20;

function calculateAngle(temperature) {
    return min + temperature * 20;
}

function calculateTemperature(angle) {
    return (angle - min) / 20;
}

function writeNumber(angle) {
    wiringpi.pwmWrite(18, angle);
    currentAngle = angle;
    console.log(angle);
}

function delayedWrite(currentAngle, desiredAngle, positive) {
    // break if desiredAngle has been reached
    if (positive && (currentAngle >= desiredAngle)) return;
    if (!positive && (currentAngle <= desiredAngle)) return;
    setTimeout(function () {
        if (positive)
            currentAngle++;
        else
            currentAngle--;
        // console.log(currentAngle);

        writeNumber(currentAngle);
        // call next() recursively
        delayedWrite(currentAngle, desiredAngle, positive);
    }, delayPeriod);
}

function writeNumberSlow(angle) {
    wiringpiFunctionality();
    if (angle > currentAngle) {
        delayedWrite(currentAngle, angle, true, wiringpi);
    } else {
        delayedWrite(currentAngle, angle, false, wiringpi);
    }
    setTimeout(wiringpiClear, delayPeriod*200 + 1000);
}

// wiringpi end


var currentTime;
var previousTime = '00:00';
var currentTemp = 0;
var lastTime;
var lastTemp;

function setTemperature(temp) {
    console.log();
    console.log('Temperature set to: ' + temp);
    writeNumberSlow(calculateAngle(temp));
}

function printInfo() {
    console.log();
    console.log('current temperature: \t' + currentTemp);
    console.log('last temperature: \t' + lastTemp + ' (updated only when needed)');
    console.log('previous time: \t\t' + previousTime);
    console.log('current time: \t\t' + currentTime);
    console.log('last time: \t\t' + lastTime + ' (updated only when needed)');
}

function writeCurrentTempToDB() {
    CurrentTimeConfig.updateOne({}, {
        $set: {
            time: new Date().getTime(),
            temperature: calculateTemperature(currentAngle)
        }
    }, function (err, timeConfig) {
        if (err) throw err;
        console.log('Wrote current temperature to db.')
    });
}

function updateLastConfig() {
    TimeConfig.find().sort({time: -1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        console.log('Updating last config');
        if (timeConfigs.length > 0) {
            lastTime = timeConfigs[0].time;
            lastTemp = timeConfigs[0].temperature;
        } else {
            lastTime = '00:00';
            lastTemp = 0;
        }
    });
}

function updatePreviousConfig() {
    TimeConfig.find({time: {$lt: currentTime}}).sort({time: -1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if (timeConfigs.length > 0) {
            if (previousTime !== timeConfigs[0].time || currentTemp !== timeConfigs[0].temperature) {
                previousTime = timeConfigs[0].time;
                currentTemp = timeConfigs[0].temperature;
                console.log('Change found');
                setTemperature(currentTemp);
            }
        } else {
            if (previousTime !== lastTime || currentTemp !== lastTemp) {
                previousTime = lastTime;
                currentTemp = lastTemp;
                setTemperature(currentTemp);
            }
            updateLastConfig();
        }
    });
}

function updateTime() {
    var date = new Date();
    var hours = date.getHours();
    if (hours <= 9) {
        hours = '0' + hours;
    }
    var minutes = date.getMinutes();
    if (minutes <= 9) {
        minutes = '0' + minutes;
    }
    currentTime = hours + ':' + minutes;
}

function everyMinute() {
    updateTime();
    // update of last configuration at end of the day
    if(currentTime === '23:59')
        updateLastConfig();
    updatePreviousConfig();
    setTimeout(printInfo, 3000);
    setTimeout(writeCurrentTempToDB, 4000);
}

function main() {
    wiringpiFunctionality();
    writeNumber(calculateAngle(0));
    setTimeout(updateLastConfig, 2000);
    setTimeout(everyMinute, 7000);
    setInterval(everyMinute, 60000);
}

main();

