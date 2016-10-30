'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
var MINUTES_IN_DAY = 24 * 60;

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
    var freeTime = findFreeTime(gangSchedule, bankSchedual, duration);

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

            return showMessage(template, freeTime);
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
    var time = [];

    var objectProp = Object.keys(workingHours);
    for (var i = 0; i < objectProp.length; i++) {
        time = parseTime(workingHours[objectProp[i]]);
        bankSchedual.push((Number(time[0]) + Number(time[1])) * 60);
    }
    bankSchedual.push(Number(time[2]));

    return bankSchedual;
}

function parseTime(time, day) {
    if (!day) {
        var regTime = /[:]|[+]/;
        time = time.split(regTime);
    } else {
        var regTimeDay = /\s|[:]|[+]/;
        time = time.split(regTimeDay);
    }

    return time;
}

function parseGangObj(schedule, timeZone) {
    var gangSchedule = {};

    Object.keys(schedule).forEach(function (item) {
        gangSchedule[item] = [];
        for (var i = 0; i < schedule[item].length; i++) {
            var eachDay = parsEachDay(schedule[item][i], timeZone);
            gangSchedule[item].push(eachDay);
        }
    });

    return gangSchedule;
}

function parsEachDay(daysAnaTime, timeZone) {
    var convertTimeObj = {};

    Object.keys(daysAnaTime).forEach(function (item) {
        var convertTime = parseTime(daysAnaTime[item], true);
        var resetZone = 0;
        var dayIndex = DAYS.indexOf(convertTime[0]);
        if (Number(convertTime[3]) !== timeZone) {
            resetZone = (timeZone - convertTime[3]) * 60;
        }
        var time = + Number(convertTime[1]) * 60 + Number(convertTime[2]) +
                                                    Number(resetZone) +
                                                    (dayIndex * 1440);
        convertTimeObj['day' + item] = convertTime[0];
        convertTimeObj[item] = time;
    });

    return convertTimeObj;
}

function findFreeTime(gangSchedule, bankSchedual, duration) {
    var arrayOfWeekDays = buildArrayOfWeek(bankSchedual);
    var arrGangTime = setkGangTime(gangSchedule, bankSchedual, arrayOfWeekDays);
    var processingTime = checkGangTime(arrGangTime, duration);

    return processingTime;
}

function buildArrayOfWeek(bankSchedual) {
    var weekDaysString = [];
    var bankOn = bankSchedual[0];
    var bankOff = bankSchedual[1];
    for (var i = 0; i < 7; i++) {
        for (var j = 0; j < MINUTES_IN_DAY; j++) {
            weekDaysString.push(setArrPosition(i, j, bankOn, bankOff));
        }
    }

    return weekDaysString;
}

function setArrPosition(i, j, bankOn, bankOff) {
    if (j >= bankOn && j < bankOff) {
        return 1;
    }

    return 0;
}

function setkGangTime(gangSchedule, bankSchedual, arrDays) {
    Object.keys(gangSchedule).forEach(function (item) {
        for (var i = 0; i < gangSchedule[item].length; i++) {
            var dataOfEach = gangSchedule[item][i];
            arrDays = checkInterval(dataOfEach, bankSchedual, arrDays);
        }
    });

    return arrDays;
}

function checkInterval(timeOfEach, bankSchedual, arrDays) {
    var data = {
        busyFrom: timeOfEach.from,
        busyTo: timeOfEach.to
    };

    return setTimeForThis(data, arrDays);
}

function setTimeForThis(data, arrDays) {
    for (var i = data.busyFrom; i < data.busyTo; i++) {
        arrDays[i] = 0;
    }

    return arrDays;
}

function checkGangTime(arrGangTime, duration) {
    var timeData = [];
    var indexForDay = 0;
    var sortedTime = [];

    for (var i = 0; i < arrGangTime.length; i++) {
        if ((i % 1440) === 0) {
            var forEachDay = arrGangTime.slice(i, (i + 1440)).join('');
            sortedTime = sortArr(forEachDay, indexForDay, duration);
            indexForDay++;
        }
        if (sortedTime && (i % 1440) === 0) {
            timeData.push(sortedTime);
        }
    }

    return timeData;
}

function sortArr(forEachDay, indexForDay, duration) {
    if (indexForDay < 1 || indexForDay > 3) {
        return false;
    }

    var dataSortedTime = {};

    var regTime = forEachDay.match(/[1]+/g).map(function (item) {
        if (item.length >= duration) {

            return item.length;
        }

        return false;
    });

    dataSortedTime.dur = regTime;
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
        for (var i = 0; i < item.dur.length; i++) {
            if (item.dur[i]) {
                positiveResult = true;
            }
        }
    });

    return positiveResult;
}

function showMessage(template, freeTime) {
    var token = true;
    var timeData = []
    freeTime.forEach(function (item) {
        for (var i = 0; i < item.dur.length; i++) {
            if (item.dur[i] && token) {
                timeData.push(item.day);
                timeData.push(item.start[i]);
                token = false;
            }
        }
    });

    return buildMessage(template, timeData);
}

function buildMessage(template, timeData) {
    var regD = /%[D]{2}/;
    var regT = /%[HM]{2}/;
    var hours = String(parseInt(timeData[1] / 60)) || '00';
    hours = (hours.length === 1) ? '0' + hours : hours;
    var minute = String(timeData[1] % 60) || '00';
    minute = (minute.length === 1) ? '0' + minute : minute;
    template = template.replace(regD, timeData[0])
                        .replace(regT, hours)
                        .replace(regT, minute);

    return template;
}
