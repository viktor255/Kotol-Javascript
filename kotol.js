var mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/kotol');
mongoose.connect('mongodb://viktor:viktor-bojler@boilertimeconfigs-shard-00-00-ssig8.mongodb.net:27017,boilertimeconfigs-shard-00-01-ssig8.mongodb.net:27017,boilertimeconfigs-shard-00-02-ssig8.mongodb.net:27017/kotol?ssl=true&replicaSet=boilerTimeConfigs-shard-0&authSource=admin');

var TimeConfig = require('./models/timeConfig');


// wiringpi start
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

var min = 80;
var max = 260;
var currentAngle = min;
var delayPeriod = 0.01;

function calculateAngle(temperature) {
    return min + temperature*20;
}

function writeNumber(angle) {
    wiringpi.pwmWrite(18, angle);
    currentAngle = angle;
}

function writeNumberSlow(angle) {
    var i = currentAngle;
    if(angle > currentAngle) {
        for (; i > angle; i--) {
            writeNumber(i);
            setTimeout(delayPeriod);
        }
    } else {
        for (; i < angle; i++) {
            writeNumber(i);
            setTimeout(delayPeriod);
        }
    }
}

// wiringpi end


var currentTime;
var lastTime = '00:00';
var nextTime = '00:00';
var currentTemp = 0;
var nextTemp = 0;

function setTemperature(temp){
    console.log();
    console.log('Temperature set to: ' + temp);
    writeNumber(calculateAngle(temp));
}

function printInfo(){
    console.log();
    console.log('current temperature: \t' + currentTemp);
    console.log('next temperature: \t' + nextTemp);
    console.log('last time: \t\t' + lastTime);
    console.log('current time: \t\t' + currentTime);
    console.log('next time: \t\t' + nextTime);
}

function updateNextConfig(){
    TimeConfig.find({time: {$gt: currentTime }}).sort({time:1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if(timeConfigs.length > 0 ) {
            nextTime = timeConfigs[0].time;
            nextTemp = timeConfigs[0].temperature;
        }
        printInfo();
    });
}

function temperatureInit(){
    TimeConfig.find({time: {$lt: currentTime }}).sort({time:-1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if(timeConfigs.length > 0 ) {
            lastTime = timeConfigs[0].time;
            currentTemp = timeConfigs[0].temperature;
            writeNumber(calculateAngle(currentTemp));
        }
    });
    TimeConfig.find({time: {$gte: currentTime }}).sort({time:1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        if(timeConfigs.length > 0 ) {
            nextTime = timeConfigs[0].time;
            nextTemp = timeConfigs[0].temperature;
        }
    });
}

function updateTime(){
    var date = new Date();
    var hours = date.getHours();
    if(hours <= 9) {
        hours = '0' + hours;
    }
    var minutes = date.getMinutes();
    if(minutes <= 9) {
        minutes = '0' + minutes;
    }
    currentTime = hours + ':' + minutes;
}

function everyMinute(){
    updateTime();
    if(currentTime >= nextTime) {
        lastTime = nextTime;
        currentTemp = nextTemp;
        setTemperature(currentTemp);
    }
    updateNextConfig();

}

writeNumber(calculateAngle(currentTemp));
updateTime();
temperatureInit();
setTimeout(everyMinute, 5000);
setInterval(everyMinute, 60000);
