'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
var DAYDURATION = 1440;

var checkFreeTime = false;
var freeTime = {};
var startTime = {};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    convertBankInf(workingHours, 2);
    iterateGangObject(schedule);
    countTime(duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return checkFreeTime;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return convertText(template, 'first');
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

function convertBankInf(item, index) {
    var setDateFrom = createNewDate(item.from);
    var setDateTo = createNewDate(item.to);
    var timeFrom = setDateFrom[1] * 60 + setDateFrom[2];
    var timeTo = setDateTo[1] * 60 + setDateTo[2];

    Object.defineProperties(freeTime, {
        'timeFrom': {
            value: timeFrom,
            enumerable: true
        },
        'timeTo': {
            value: timeTo,
            enumerable: true
        },
        timeZone: {
            value: setDateFrom[3],
            enumerable: true
        }
    });

    for (var i = 1; i <= index + 1; i++) {
        freeTime[DAYS[i]] = Array(timeTo - timeFrom);
        startTime[DAYS[i]] = [];
    }
}

function iterateGangObject(arrSchedule) {
    for (var key in arrSchedule) {
        if (arrSchedule.hasOwnProperty(key)) {
            arrSchedule[key].forEach(convertGangInf);
        }
    }
}

function convertGangInf(item) {
    var setDateFrom = createNewDate(item.from);
    var setDateTo = createNewDate(item.to);
    var resetZone = (freeTime.timeZone - setDateTo[3]) * 60;
    var start = setDateFrom[1] * 60 + setDateFrom[2] + resetZone;
    var end = setDateTo[1] * 60 + setDateTo[2] + resetZone;
    var arrayOfMinFrom = freeTime[setDateFrom[0]];
    var arrayOfMinTo = freeTime[setDateTo[0]];

    if (start > DAYDURATION) {
        start = 1440;
    }
    if (end < 0) {
        var dayIndex = DAYS.indexOf(setDateTo[0]);
        setDateTo = DAYS[dayIndex - 1];
        end = DAYDURATION + end;
    }

    var data = {
        dayFrom: setDateFrom[0],
        dayTo: setDateTo[0],
        start: start,
        end: end,
        arrFrom: arrayOfMinFrom,
        arrTo: arrayOfMinTo
    };

    setInterval(data);
}

function setInterval(data) {
    if (data.dayFrom === data.dayTo) {
        compareTime(data.start, data.end, data.arrFrom);
    }
    if ((data.dayFrom !== data.dayTo) && data.dayFrom === DAYS[0]) {
        compareTime(0, data.end, data.arrTo);
    }
    if ((data.dayFrom !== data.dayTo) && data.dayTo === DAYS[4]) {
        compareTime(data.start, DAYDURATION, data.arrFrom);
    }
    if ((data.dayFrom !== data.dayTo) && data.dayFrom !== DAYS[0] &&
                                         data.dayTo !== DAYS[4]) {
        compareTime(data.start, DAYDURATION, data.arrFrom);
        compareTime(0, data.end, data.arrTo);
    }
}

function createNewDate(dateTemplate) {
    var regTime = /\d\d/g;

    var day = dateTemplate.slice(-10, -8);
    var time = dateTemplate.match(regTime);
    var timeZone = dateTemplate.slice(-1);
    var arrResult = [day, Number(time[0]), Number(time[1]), Number(timeZone)];

    return arrResult;
}

function compareTime(start, end, arr) {
    var bankOn = freeTime.timeFrom;
    var bankOff = freeTime.timeTo;

    for (var i = bankOn; i < bankOff; i++) {
        var pos = i - bankOn;
        if ((i < start || i >= end) && arr[pos] !== 0) {
            arr[pos] = 1;
        } else {
            arr[pos] = 0;
        }
    }
}

function countTime(duration) {
    var day = Object.keys(freeTime);
    for (var i = 3; i < day.length; i++) {
        var arrayToString = freeTime[day[i]].join('');
        setStartTIme(arrayToString, day[i]);
        var objectOfMin = freeTime[day[i]].join('').match(/[1]+/g);
        freeTime[day[i]].length = 0;
        if (objectOfMin instanceof Array) {
            var dur = { duration: duration, day: day[i] };
            var findFreeTime = objectOfMin.filter(calculateTime, dur);
            checkFreeTime = findFreeTime.length !== 0;
        }
    }
}

function setStartTIme(string, day) {
    for (var i = 0; i < string.length; i++) {
        if (string[i] === '1' && string[i - 1] === undefined) {
            startTime[day].push(i);
        }
        if (string[i] === '1' && string[i - 1] === '0') {
            startTime[day].push(i);
        }
    }
}

/**
 * @this {Object} duration and day – Проставляет данные о начале ограбления
 */

function calculateTime(item) {
    var lengthTime = item.length;
    if (lengthTime >= this.duration) {
        freeTime[this.day].push(lengthTime);

        return lengthTime;
    }

    if (lengthTime < this.duration) {
        freeTime[this.day].push(0);
    }
}

function convertText(template, amount) {
    if (!checkFreeTime) {
        return '';
    }

    if (amount === 'first') {
        return convertOneMessage(template);
    }
}

function convertOneMessage(template) {
    var day = Object.keys(freeTime);
    var data = {};
    for (var i = 3; i < day.length; i++) {
        var findTime = findFirstTime(freeTime[day[i]], day[i]);
        if (typeof findTime === 'object' && findTime !== undefined) {
            Object.defineProperties(data, {
                template: {
                    value: template,
                    enumerable: true,
                    writable: true
                },
                time: {
                    value: findTime,
                    enumerable: true,
                    writable: true
                },
                date: {
                    value: day[i],
                    enumerable: true,
                    writable: true
                }
            });

            return filterDays(data);
        }
    }
}

function findFirstTime(time, day) {
    for (var i = 0; i < time.length; i++) {
        if (time[i] !== 0) {

            return { dur: time[i], start: startTime[day][i] };
        }
    }
}

function filterDays(data) {
    var regD = /%[D]{2}/;
    var regT = /%[HM]{2}/;
    var hours = parseInt((freeTime.timeFrom + data.time.start) / 60) || '00';
    hours = (hours.length === 1) ? '0' + hours : hours;
    var minute = String((freeTime.timeFrom + data.time.start) % 60) || '00';
    minute = (minute.length === 1) ? '0' + minute : minute;
    var template = data.template.replace(regD, data.date)
                                .replace(regT, hours)
                                .replace(regT, minute);

    return template;
}
