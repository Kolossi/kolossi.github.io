define(['jquery-1.9', 'smp/login-check'],function ($, LoginCheck) {

    /**
     * Constructor the the UAS module
     * @constructor
     */
    function Uas(options) {
        this.init(options);
    }

    Uas.prototype.client = null;

    /**
     * Initialise the UAS Client
     */
    Uas.prototype.init = function(options) {
        var _this = this;
        this.active = false; // By default assume UAS is active
        this.failCount = 0; // Count how many times a UAS call has failed
        this.saved_time = 0;

        var optionsObject = {
            env: "live",
            domainSuffix: "co.uk",
            apiKey: null,
            heartbeatFrequency: 30,
            failTimes: [
                120000, // 2 minutes
                300000, // 5 minutes
                600000 // 10 minutes
            ]
        };

        this.options = $.extend({}, optionsObject, options);

        if (this.options.apiKey &&
            LoginCheck.isUserLoggedIn()
        ) {
            this.active = true;
        }

        if (this.active) {
            require(['uasclient'], function (UasClient) {
                if (!_this.client) {
                    _this.client = UasClient;
                    _this.client.init(_this.options);
                }
            });
        }
    };

    Uas.prototype.registerHeartbeat = function(time) {
        var data = {
            heartbeat: "true",
            timeupdate: time,
            action: "started"
        };
        if ((time % this.options.heartbeatFrequency) === 0  && time != this.saved_time) {
            this.saved_time = time;
            this.send(data);
        }
    };

    Uas.prototype.registerPaused = function(time) {
        var data = {
            heartbeat: "false",
            timeupdate: time,
            action: "paused"
        };
        this.send(data);
    };

    Uas.prototype.registerStarted = function(time) {
        var data = {
            heartbeat: "false",
            timeupdate: time,
            action: "started"
        };
        this.send(data);
    };

    Uas.prototype.registerEnded = function(time) {
        var data = {
            heartbeat: "false",
            timeupdate: time,
            action: "ended"
        };
        this.send(data);
    };

    Uas.prototype.create = function(client, uasObject) {
        var _this = this,
            deferred = $.Deferred();
        if (!this.active) {
            return;
        }
        client.create({
            activityType    : this.options.activityType,
            resourceDomain  : this.options.resourceDomain,
            resourceType    : this.options.resourceType,
            resourceId      : this.options.pid,
            action          : uasObject.action,
            heartbeat       : uasObject.heartbeat,
            actionContext   : "urn:bbc:" +
            this.options.resourceDomain + ":" +
            this.options.resourceType + ":" +
            this.options.pid + "#" +
            uasObject.timeupdate
        }, function (err, res) {
            if (err) {
                deferred.reject(err);
                // Set active to false and initiate the circuit breaker
                _this.active = false;
                _this.initCircuitBreaker();
            } else {
                deferred.resolve("success");
                _this.active = true;
                _this.failCount = 0;
            }
        });

        return deferred.promise();
    };

    /**
     * The send function for the UAS Client
     * @param uasObject
     */
    Uas.prototype.send = function(uasObject) {
        var _this = this;
        require (['uasclient'], function(UasClient) {
            if (!_this.client) {
                _this.client = UasClient;
                _this.client.init(_this.options);
            }
            _this.create(_this.client, uasObject);
        });
    };

    /**
     * Circuit breaker for if the UAS response is invalid
     */
    Uas.prototype.initCircuitBreaker = function() {
        var _this = this;

        // Set timeout milliseconds depending on how many times it has failed before
        // After the specified amount of retries has finished, then it will stop retrying
        if (_this.options.failTimes[_this.failCount] !== undefined) {
            window.setTimeout(function() {
                _this.active = true;
            }, _this.options.failTimes[_this.failCount]);
        }

        this.failCount++;
    };

    return Uas;
});
