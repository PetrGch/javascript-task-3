'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

var freeTime = {};
var remainsTime = {
    endDay: 1439,
    rest: 0
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    convertBankInf(workingHours, 2);
    iterateGangObject(schedule);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return countTime(duration);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            template = convertText();

            return template;
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
    var end = setDateTo[1] * 60 + setDateTo[2] + resetZone - 1;
    var arrayOfMin = freeTime[setDateFrom[0]];

    if (setDateFrom[0] !== setDateTo[0]) {
        arrayOfMin = freeTime[setDateFrom[0]];
        compareTime(start, remainsTime.endDay, arrayOfMin);
        arrayOfMin = freeTime[setDateTo[0]];
        compareTime(0, end, arrayOfMin);
    } else {
        compareTime(start, end, arrayOfMin);
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

    for (var i = bankOn; i <= bankOff; i++) {
        var pos = i - bankOn;
        if ((i < start || i > end) && arr[pos] !== 0) {
            arr[pos] = 1;
        } else {
            arr[pos] = 0;
        }
    }
}

function countTime(duration) {
    var check = false;
    var day = Object.keys(freeTime);
    var i = 3;
    while (i < day.length) {
        var objectOfMin = freeTime[day[i]].join('').match(/[1]+/g);
        freeTime[day[i]].length = 0;
        if (objectOfMin instanceof Array) {
            var findFreeTime = objectOfMin.map(calculateTime);
            check = findFreeTime.length !== 0;
        }
        i++;
    }
    function calculateTime(item) {
        var lengthTime = item.length;
        if (lengthTime >= duration) {
            freeTime[day[i]].push(lengthTime);

            return lengthTime;
        }
    }

    return check;
}

function convertText() {
    var findDay = '';
    var time = '';
    var token = true;
    var day = Object.keys(freeTime);
    for (var i = 3, j = 0; i < day.length; i++, j++) {
        if (freeTime[day[i]][j] && token) {
            findDay = day[i];
            var hours = parseInt((freeTime.timeFrom + 90) / 60);
            var minute = (freeTime.timeFrom + 90) % 60;
            time = hours + ':' + minute;
            token = false;
        }
    }
    var resultString = (time) ? ('Метим на ' + findDay + ', старт в ' + time + '!') : '';

    return resultString;
}
