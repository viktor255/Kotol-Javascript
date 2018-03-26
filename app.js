var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/kotol');

var TimeConfig = require('./models/timeConfig');


var currentTime;
var lastTime = '00:00';
var nextTime = '00:00';
var currentTemp = 0;
var nextTemp = 0;

function setTemperature(temp){
    console.log();
    console.log('Temperature set to: ' + temp);
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
        nextTime = timeConfigs[0].time;
        nextTemp = timeConfigs[0].temperature;
        printInfo();
    });
}

function temperatureInit(){
    TimeConfig.find({time: {$lt: currentTime }}).sort({time:-1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        lastTime = timeConfigs[0].time;
        currentTemp = timeConfigs[0].temperature;
    });
    TimeConfig.find({time: {$gte: currentTime }}).sort({time:1}).exec(function (err, timeConfigs) {
        if (err) throw err;
        nextTime = timeConfigs[0].time;
        nextTemp = timeConfigs[0].temperature;
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

updateTime();
temperatureInit();
setTimeout(everyMinute, 5000);
setInterval(everyMinute, 60000);
