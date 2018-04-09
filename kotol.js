var mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/kotol');
mongoose.connect('mongodb://viktor:viktor-bojler@boilertimeconfigs-shard-00-00-ssig8.mongodb.net:27017,boilertimeconfigs-shard-00-01-ssig8.mongodb.net:27017,boilertimeconfigs-shard-00-02-ssig8.mongodb.net:27017/kotol?ssl=true&replicaSet=boilerTimeConfigs-shard-0&authSource=admin');

var TimeConfig = require('./models/timeConfig');
var CurrentTimeConfig = require('./models/currentTimeConfig');


// wiringpi start
function wiringpiFunctionality() {
    var wiringpi = require('wiringpi-node');
    // var wiringpi = require('wiring-pi');

    // # use 'GPIO naming'
    wiringpi.setup('gpio');

    // # set #18 to be a PWM output
    wiringpi.pinMode(18, wiringpi.PWM_OUTPUT);

    // # set the PWM mode to milliseconds stype
    wiringpi.pwmSetMode(wiringpi.PWM_MODE_MS);

    // # divide down clock
    wiringpi.pwmSetClock(192);
    wiringpi.pwmSetRange(2000);

    return wiringpi;

}

var min = 80;
var max = 260;
var currentAngle = min;
var delayPeriod = 10;

function calculateAngle(temperature) {
    return min + temperature * 20;
}

function calculateTemperature(angle) {
    return (angle - min) / 20;
}

function writeNumber(angle, wiringpi) {
    // var wiringpi = require('wiringpi-node');
    //
    // // # use 'GPIO naming'
    // wiringpi.setup('gpio');
    //
    // // # set #18 to be a PWM output
    // wiringpi.pinMode(18, wiringpi.PWM_OUTPUT);
    //
    // // # set the PWM mode to milliseconds stype
    // wiringpi.pwmSetMode(wiringpi.PWM_MODE_MS);
    //
    // // # divide down clock
    // wiringpi.pwmSetClock(192);
    // wiringpi.pwmSetRange(2000);

    wiringpi.pwmWrite(18, angle);
    currentAngle = angle;
}

function delayedWrite(currentAngle, desiredAngle, positive, wiringpi) {
    // break if desiredAngle has been reached
    if (positive && (currentAngle >= desiredAngle)) return;
    if (!positive && (currentAngle <= desiredAngle)) return;
    setTimeout(function () {
        if (positive)
            currentAngle++;
        else
            currentAngle--;
        // console.log(currentAngle);

        writeNumber(currentAngle, wiringpi);
        // call next() recursively
        delayedWrite(currentAngle, desiredAngle, positive);
    }, delayPeriod);
}

function writeNumberSlow(angle) {
    var wiringpi = wiringpiFunctionality();
    if (angle > currentAngle) {
        delayedWrite(currentAngle, angle, true, wiringpi);
    } else {
        delayedWrite(currentAngle, angle, false, wiringpi);
    }
}

// wiringpi end


var currentTime;
var lastTime = '00:00';
var nextTime = '00:00';
var currentTemp = 0;
var nextTemp = 0;

function setTemperature(temp) {
    console.log();
    console.log('Temperature set to: ' + temp);
    writeNumberSlow(calculateAngle(temp));
}

function printInfo() {
    console.log();
    console.log('current temperature: \t' + currentTemp);
    console.log('next temperature: \t' + nextTemp);
    console.log('last time: \t\t' + lastTime);
    console.log('current time: \t\t' + currentTime);
    console.log('next time: \t\t' + nextTime);
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

function updateNextConfig() {
    TimeConfig.find({time: {$gt: currentTime}}).sort({time: 1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if (timeConfigs.length > 0) {
            nextTime = timeConfigs[0].time;
            nextTemp = timeConfigs[0].temperature;
        }
        printInfo();
    });
}

function updateLastConfig() {
    TimeConfig.find({time: {$lt: currentTime}}).sort({time: -1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if (timeConfigs.length > 0) {
            if (lastTime !== timeConfigs[0].time) {
                lastTime = timeConfigs[0].time;
                currentTemp = timeConfigs[0].temperature;
                setTemperature(currentTemp);
            }
        }
    });
}

function temperatureInit() {
    TimeConfig.find({time: {$lt: currentTime}}).sort({time: -1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if (timeConfigs.length > 0) {
            lastTime = timeConfigs[0].time;
            currentTemp = timeConfigs[0].temperature;
            setTemperature(currentTemp);
        }
    });
    TimeConfig.find({time: {$gte: currentTime}}).sort({time: 1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if (timeConfigs.length > 0) {
            nextTime = timeConfigs[0].time;
            nextTemp = timeConfigs[0].temperature;
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
    if (currentTime >= nextTime) {
        lastTime = nextTime;
        currentTemp = nextTemp;
        setTemperature(currentTemp);
    }
    writeCurrentTempToDB();
    updateNextConfig();
    updateLastConfig();
}

writeNumber(calculateAngle(currentTemp), wiringpiFunctionality());
updateTime();
// temperatureInit();
setTimeout(temperatureInit, 2000);
setTimeout(everyMinute, 7000);
setInterval(everyMinute, 60000);
