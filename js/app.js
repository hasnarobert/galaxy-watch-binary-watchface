/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
    var timerUpdateDate = 0,
        flagDigital = false,
        battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery,
        interval,
        arrDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        arrMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        matrix = [[], [], [], []];

    /**
     * Updates the date and sets refresh callback on the next day.
     * @private
     * @param {number} prevDay - date of the previous day
     */
    function updateDate(prevDay) {
        var datetime = tizen.time.getCurrentDateTime(),
            nextInterval,
            strDay = document.getElementById("str-day"),
            strFullDate,
            getDay = datetime.getDay(),
            getDate = datetime.getDate(),
            getMonth = datetime.getMonth();

        // Check the update condition.
        // if prevDate is '0', it will always update the date.
        if (prevDay !== null) {
            if (prevDay === getDay) {
                /**
                 * If the date was not changed (meaning that something went wrong),
                 * call updateDate again after a second.
                 */
                nextInterval = 1000;
            } else {
                /**
                 * If the day was changed,
                 * call updateDate at the beginning of the next day.
                 */
                // Calculate how much time is left until the next day.
                nextInterval =
                    (23 - datetime.getHours()) * 60 * 60 * 1000 +
                    (59 - datetime.getMinutes()) * 60 * 1000 +
                    (59 - datetime.getSeconds()) * 1000 +
                    (1000 - datetime.getMilliseconds()) +
                    1;
            }
        }

        if (getDate < 10) {
            getDate = "0" + getDate;
        }

        strFullDate = arrDay[getDay] + " " + getDate + " " + arrMonth[getMonth];
        strDay.innerHTML = strFullDate;

        // If an updateDate timer already exists, clear the previous timer.
        if (timerUpdateDate) {
            clearTimeout(timerUpdateDate);
        }

        // Set next timeout for date update.
        timerUpdateDate = setTimeout(function() {
            updateDate(getDay);
        }, nextInterval);
    }

    /**
     * Updates the current time.
     * @private
     */
    function updateTime() {
        var datetime = tizen.time.getCurrentDateTime();
		updateMatrix(datetime.getHours(), datetime.getMinutes());
    }

    /**
     * Sets to background image as BACKGROUND_URL,
     * and starts timer for normal digital watch mode.
     * @private
     */
    function initDigitalWatch() {
        flagDigital = true;
        interval = setInterval(updateTime, 1000);
        for (var i = 0; i < 4; ++i) {
        		for (var j = 0; j < 4; ++j) {
        			var element = document.getElementById('binary-time-' + i + '-' + j );
        			matrix[i][j] = element;
        		}
        }
        
        getBatteryState();
    }
    
    function updateMatrix(hours, minutes) {
    		var minuteSecondDigit = minutes % 10;
    		var minuteFirstDigit = minutes / 10;
    		var hourSecondDigit = hours % 10;
    		var hourFirstDigit = hours / 10;
    		
    		updateMatrixColumn(3, minuteSecondDigit);
    		updateMatrixColumn(2, minuteFirstDigit);
    		updateMatrixColumn(1, hourSecondDigit);
    		updateMatrixColumn(0, hourFirstDigit);
    }
    
    function updateMatrixColumn(columnIndex, value) {
    		for (var i = 0; i < 4; ++i) {
    			matrix[columnIndex][i].setAttribute('active', !!(value & (1 << i)));
    		}
    }

    /**
     * Clears timer and sets background image as none for ambient digital watch mode.
     * @private
     */
    function ambientDigitalWatch() {
        flagDigital = false;
        clearInterval(interval);
        updateTime();
    }

    /**
     * Gets battery state.
     * Updates battery level.
     * @private
     */
    function getBatteryState() {
        var batteryLevel = Math.floor(battery.level * 100),
            batteryFill = document.getElementById("battery-fill");
        
        batteryFill.style.width = batteryLevel + "%";
        var batteryColor;
        if (batteryLevel <= 20) {
        		batteryColor = "red";
        } else if (batteryLevel <= 40) {
        		batteryColor = "yellow";
        } else {
        		batteryColor = "rgb(200, 200, 200)";
        }
        batteryFill.style.backgroundColor = batteryColor;
    }

    /**
     * Updates watch screen. (time and date)
     * @private
     */
    function updateWatch() {
        updateTime();
        updateDate(0);
    }

    /**
     * Binds events.
     * @private
     */
    function bindEvents() {
        // add eventListener for battery state
        battery.addEventListener("chargingchange", getBatteryState);
        battery.addEventListener("chargingtimechange", getBatteryState);
        battery.addEventListener("dischargingtimechange", getBatteryState);
        battery.addEventListener("levelchange", getBatteryState);

        // add eventListener for timetick
//        window.addEventListener("timetick", function() {
//            ambientDigitalWatch();
//        });
//
//        // add eventListener for ambientmodechanged
//        window.addEventListener("ambientmodechanged", function(e) {
//            if (e.detail.ambientMode === true) {
//                // rendering ambient mode case
//                ambientDigitalWatch();
//
//            } else {
//                // rendering normal digital mode case
//                initDigitalWatch();
//            }
//        });

        // add eventListener to update the screen immediately when the device wakes up.
        document.addEventListener("visibilitychange", function() {
            if (!document.hidden) {
                updateWatch();
            }
        });

        // add event listeners to update watch screen when the time zone is changed.
        tizen.time.setTimezoneChangeListener(function() {
            updateWatch();
        });
    }

    /**
     * Initializes date and time.
     * Sets to digital mode.
     * @private
     */
    function init() {
        initDigitalWatch();
        updateDate(0);

        bindEvents();
    }

    window.onload = init();
}());
