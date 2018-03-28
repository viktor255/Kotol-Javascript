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
var delayPeriod = 10;

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
