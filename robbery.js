'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var HOURS_IN_DAY = 24;
var MINUTES_IN_HOUR = 60;
var DAYS_IN_WEEK = 7;
var MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var bankSchedual = parseBankObj(workingHours);
    var gangSchedule = parseGangObj(schedule, bankSchedual[2]);
    var freeTime = getFreeTime(gangSchedule, bankSchedual, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return findFirstInput(freeTime);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            return returnMessage(template, freeTime);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
};

function parseBankObj(workingHours) {
    var bankSchedual = [];
    var workingTime = [];

    var objectProp = Object.keys(workingHours);
    for (var i = 0; i < objectProp.length; i++) {
        workingTime = parseTime(workingHours[objectProp[i]]);
        bankSchedual.push((Number(workingTime[0]) * MINUTES_IN_HOUR) + Number(workingTime[1]));
    }
    bankSchedual.push(Number(workingTime[2]));

    return bankSchedual;
}

function parseTime(workingTime, day) {
    if (!day) {
        var regTime = /[:]|[+]/;

        return workingTime.split(regTime);
    }
    var regTimeDay = /\s|[:]|[+]/;

    return workingTime.split(regTimeDay);
}

function parseGangObj(schedule, timeZone) {
    var gangSchedule = {};

    var keys = Object.keys(schedule);
    keys.forEach(function (item) {
        gangSchedule[item] = [];
        for (var i = 0; i < schedule[item].length; i++) {
            var personalTime = schedule[item][i];
            var eachDay = parsEachDay(personalTime, timeZone);
            gangSchedule[item].push(eachDay);
        }
    });

    return gangSchedule;
}

function parsEachDay(personalTime, timeZone) {
    var convertTimeObj = {};

    var keys = Object.keys(personalTime);
    keys.forEach(function (item) {
        var convertTime = parseTime(personalTime[item], true);
        var resetZone = 0;
        var dayIndex = DAYS.indexOf(convertTime[0]);
        var timeZoneOfGang = Number(convertTime[3]);
        if (timeZoneOfGang !== timeZone) {
            resetZone = (timeZone - timeZoneOfGang) * MINUTES_IN_HOUR;
        }
        var time = + Number(convertTime[1]) * MINUTES_IN_HOUR + Number(convertTime[2]) +
                                            Number(resetZone) +
                                            (dayIndex * MINUTES_IN_DAY);
        convertTimeObj['day' + item] = convertTime[0];
        convertTimeObj[item] = time;
    });

    return convertTimeObj;
}

function getFreeTime(gangSchedule, bankSchedual, duration) {
    var arrayOfWeekDays = buildArrayOfWeek(bankSchedual);
    var arrGangTime = setkGangTime(gangSchedule, bankSchedual, arrayOfWeekDays);
    var processingTime = checkGangTime(arrGangTime, duration);

    return processingTime;
}

function buildArrayOfWeek(bankSchedual) {
    var weekDaysString = [];
    var bankOn = bankSchedual[0];
    var bankOff = bankSchedual[1];
    for (var day = 0; day < DAYS_IN_WEEK; day++) {
        for (var min = 0; min < MINUTES_IN_DAY; min++) {
            weekDaysString.push(setArrPosition(day, min, bankOn, bankOff));
        }
    }

    return weekDaysString;
}

function setArrPosition(day, min, bankOn, bankOff) {
    if (min >= bankOn && min < bankOff) {
        return 1;
    }

    return 0;
}

function setkGangTime(gangSchedule, bankSchedual, arrDays) {
    Object.keys(gangSchedule).forEach(function (item) {
        for (var i = 0; i < gangSchedule[item].length; i++) {
            var dataOfEach = gangSchedule[item][i];
            arrDays = checkBusyTime(dataOfEach, bankSchedual, arrDays);
        }
    });

    return arrDays;
}

function checkBusyTime(timeOfEach, bankSchedual, arrDays) {
    var data = {
        busyFrom: timeOfEach.from,
        busyTo: timeOfEach.to
    };

    return setBusyTime(data, arrDays);
}

function setBusyTime(data, arrDays) {
    for (var i = data.busyFrom; i < data.busyTo; i++) {
        arrDays[i] = 0;
    }

    return arrDays;
}

function checkGangTime(arrGangTime, duration) {
    var timeData = [];
    var indexForDay = 0;
    var filteredTime = [];

    for (var i = 0; i < arrGangTime.length; i++) {
        if ((i % 1440) === 0 && indexForDay < 3) {
            var forEachDay = arrGangTime.slice(i, (i + 1440)).join('');
            filteredTime = filterArr(forEachDay, indexForDay, duration);
            indexForDay++;
            timeData.push(filteredTime);
        }
    }

    return timeData;
}

function filterArr(forEachDay, indexForDay, duration) {
    var regTime = forEachDay.match(/[1]+/g);

    if (regTime) {
        regTime = regTime.map(function (item) {
            return (item.length >= duration) ? item.length : false;
        });
    } else {
        regTime = [false];
    }

    return calculateDuration(regTime, indexForDay, forEachDay);
}

function calculateDuration(regTime, indexForDay, forEachDay) {
    var dataSortedTime = {};

    dataSortedTime.duration = regTime;
    dataSortedTime.day = DAYS[indexForDay];
    dataSortedTime.start = [];

    for (var i = 0; i < forEachDay.length; i++) {
        if (forEachDay[i] === '1' && forEachDay[i - 1] === undefined) {
            dataSortedTime.start.push(i);
        } else if (forEachDay[i] === '1' && forEachDay[i - 1] === '0') {
            dataSortedTime.start.push(i);
        }
    }

    return dataSortedTime;
}

function findFirstInput(freeTime) {
    var positiveResult = false;
    freeTime.forEach(function (item) {
        for (var i = 0; i < item.duration.length; i++) {
            if (item.duration[i]) {
                positiveResult = true;
            }
        }
    });

    return positiveResult;
}

function returnMessage(template, freeTime) {
    var brake = true;
    var timeData = [];
    freeTime.forEach(function (item) {
        for (var i = 0; i < item.duration.length; i++) {
            if (item.duration[i] && brake) {
                timeData.push(item.day);
                timeData.push(item.start[i]);
                brake = false;
            }
        }
    });

    return buildMessage(template, timeData);
}

function buildMessage(template, timeData) {
    var regDay = /%[D]{2}/;
    var regTime = /%[HM]{2}/;
    var hours = String(parseInt(timeData[1] / 60)) || '00';
    hours = (hours.length === 1) ? '0' + hours : hours;
    var minute = String(timeData[1] % 60) || '00';
    minute = (minute.length === 1) ? '0' + minute : minute;
    template = template.replace(regDay, timeData[0])
                        .replace(regTime, hours)
                        .replace(regTime, minute);

    return template;
}
